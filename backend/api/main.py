import uuid
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
from backend.api.ai import router as ai_router
from backend.api.ai import generate_ai_insight, SimulationInput
from backend.memory.store import add_simulation
from backend.memory.store import init_db
from fastapi import Request, Response
from backend.auth.users import init_users_table
from backend.auth.routes import router as auth_router
from fastapi import Depends
from backend.auth.dependencies import get_current_user



from backend.simulator.core import build_api_response


app = FastAPI(title="Life Scenario Simulator API")
init_db()
init_users_table()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ ADD THIS LINE
app.include_router(ai_router)
app.include_router(auth_router)

class SimulationRequest(BaseModel):
    monthly_income: float
    monthly_expenses: float
    goal_amount: float
    months: int
    starting_savings: float = 0

@app.get("/")
def root():
    return {"status": "Life Scenario Simulator API is running"}


@app.post("/simulate")
def simulate_life_scenario(
    request: SimulationRequest,
    current_user: dict = Depends(get_current_user)
):
    # 1️⃣ Get authenticated user ID
    user_id = current_user["id"]

    # 2️⃣ Run financial simulation
    simulation_result = build_api_response(
        monthly_income=request.monthly_income,
        monthly_expenses=request.monthly_expenses,
        goal_amount=request.goal_amount,
        months=request.months,
        starting_savings=request.starting_savings
    )

    # 3️⃣ Save simulation to persistent memory (USER-SPECIFIC)
    add_simulation(
        user_id,
        {
            "monthly_income": request.monthly_income,
            "monthly_expenses": request.monthly_expenses,
            "goal_amount": request.goal_amount,
            "months": request.months,
            "status": simulation_result["status"]
        }
    )

    # 4️⃣ Generate memory-aware AI insight
    ai_input = SimulationInput(
        monthly_income=request.monthly_income,
        monthly_expenses=request.monthly_expenses,
        goal_amount=request.goal_amount,
        months=request.months,
        status=simulation_result["status"]
    )

    ai_insight = generate_ai_insight(ai_input, user_id=user_id)

    # 5️⃣ Return response
    return {
        "simulation": simulation_result,
        "ai_insight": ai_insight
    }

    
