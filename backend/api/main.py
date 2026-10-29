from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, Request, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from backend.api.ai import router as ai_router
from backend.api.ai import generate_ai_insight, SimulationInput
from backend.memory.store import add_simulation, init_db
from backend.auth.users import init_users_table
from backend.auth.routes import router as auth_router
from backend.auth.dependencies import get_current_user
from backend.memory.store import get_user_simulations, delete_simulation
from backend.simulator.core import build_api_response
from backend.core.config import settings
from backend.memory.store import list_transactions, create_transaction, update_transaction, delete_transaction, list_budgets, save_budget
from datetime import date

settings.validate()

app = FastAPI(title="Life Scenario Simulator API")

# 🔐 Rate Limiter Setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )


init_db()
init_users_table()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cache-Control"] = "no-store"
    if settings.COOKIE_SECURE:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

app.include_router(ai_router)
app.include_router(auth_router)


# 🔐 Hardened Validation Schema
class SimulationRequest(BaseModel):
    monthly_income: float = Field(..., gt=0, le=10_000_000, allow_inf_nan=False)
    monthly_expenses: float = Field(..., ge=0, le=10_000_000, allow_inf_nan=False)
    goal_amount: float = Field(..., gt=0, le=100_000_000, allow_inf_nan=False)
    months: int = Field(..., gt=0, le=600, strict=True)
    starting_savings: float = Field(0, ge=0, le=100_000_000, allow_inf_nan=False)


class TransactionRequest(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    category: str = Field(min_length=1, max_length=40)
    amount: float = Field(gt=0, le=10_000_000, allow_inf_nan=False)
    type: str = Field(pattern="^(Income|Expense)$")
    method: str = Field(pattern="^(UPI|Cash|Card|Bank|Other)$")
    date: date
    import_source: str = Field(default="manual", pattern="^(manual|csv_import|sms_import)$")


class BudgetRequest(BaseModel):
    category: str = Field(min_length=1, max_length=40)
    month: str = Field(pattern=r"^\d{4}-\d{2}$")
    amount: float = Field(gt=0, le=10_000_000, allow_inf_nan=False)


@app.get("/")
def root():
    return {"status": "Life Scenario Simulator API is running"}


@app.get("/transactions")
def transactions(current_user: dict = Depends(get_current_user), category: str | None = None, payment_method: str | None = None, start_date: date | None = None, end_date: date | None = None, search: str | None = Query(default=None, max_length=80)):
    return list_transactions(current_user["id"], category, payment_method, start_date.isoformat() if start_date else None, end_date.isoformat() if end_date else None, search)


@app.post("/transactions", status_code=201)
def add_transaction(body: TransactionRequest, current_user: dict = Depends(get_current_user)):
    return {"id": create_transaction(current_user["id"], body.model_dump())}


@app.put("/transactions/{transaction_id}")
def edit_transaction(transaction_id: int, body: TransactionRequest, current_user: dict = Depends(get_current_user)):
    if not update_transaction(current_user["id"], transaction_id, body.model_dump()):
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"status": "updated"}


@app.delete("/transactions/{transaction_id}")
def remove_transaction(transaction_id: int, current_user: dict = Depends(get_current_user)):
    if not delete_transaction(current_user["id"], transaction_id):
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"status": "deleted"}


@app.get("/budgets")
def budgets(month: str = Query(pattern=r"^\d{4}-\d{2}$"), current_user: dict = Depends(get_current_user)):
    return list_budgets(current_user["id"], month)


@app.put("/budgets")
def put_budget(body: BudgetRequest, current_user: dict = Depends(get_current_user)):
    save_budget(current_user["id"], body.category, body.month, body.amount)
    return {"status": "saved"}


@app.post("/simulate")
@limiter.limit("20/minute")
def simulate_life_scenario(
    request: Request,
    body: SimulationRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    simulation_result = build_api_response(
        monthly_income=body.monthly_income,
        monthly_expenses=body.monthly_expenses,
        goal_amount=body.goal_amount,
        months=body.months,
        starting_savings=body.starting_savings,
    )

    add_simulation(
        user_id,
        {
            "monthly_income": body.monthly_income,
            "monthly_expenses": body.monthly_expenses,
            "goal_amount": body.goal_amount,
            "months": body.months,
            "status": simulation_result["status"],
        },
    )

    ai_input = SimulationInput(
        monthly_income=body.monthly_income,
        monthly_expenses=body.monthly_expenses,
        goal_amount=body.goal_amount,
        months=body.months,
        status=simulation_result["status"],
    )

    ai_insight = generate_ai_insight(ai_input, user_id=user_id)

    return {
        "simulation": simulation_result,
        "ai_insight": ai_insight,
    }


@app.get("/history")
@limiter.limit("30/minute")
def get_history(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    return get_user_simulations(current_user["id"])


@app.delete("/history/{simulation_id}")
@limiter.limit("10/minute")
def delete_history_item(
    request: Request,
    simulation_id: int,
    current_user: dict = Depends(get_current_user),
):
    delete_simulation(simulation_id, current_user["id"])
    return {"status": "deleted"}
