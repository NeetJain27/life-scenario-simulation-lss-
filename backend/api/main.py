import uuid
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, conint, confloat

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
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)
app.include_router(auth_router)


# 🔐 Hardened Validation Schema
class SimulationRequest(BaseModel):
    monthly_income: confloat(gt=0, le=10_000_000)
    monthly_expenses: confloat(ge=0, le=10_000_000)
    goal_amount: confloat(gt=0, le=100_000_000)
    months: conint(gt=0, le=600)  # Max 50 years
    starting_savings: confloat(ge=0, le=100_000_000) = 0


@app.get("/")
def root():
    return {"status": "Life Scenario Simulator API is running"}


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
