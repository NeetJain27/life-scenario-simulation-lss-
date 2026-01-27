from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
from backend.api.ai import router as ai_router
from backend.api.ai import generate_ai_insight, SimulationInput


from backend.simulator.core import build_api_response


app = FastAPI(title="Life Scenario Simulator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ ADD THIS LINE
app.include_router(ai_router)

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
def simulate_life_scenario(request: SimulationRequest):
    # 1️⃣ Run financial simulation
    simulation_result = build_api_response(
        monthly_income=request.monthly_income,
        monthly_expenses=request.monthly_expenses,
        goal_amount=request.goal_amount,
        months=request.months,
        starting_savings=request.starting_savings
    )

    # 2️⃣ Prepare AI input
    ai_input = SimulationInput(
        monthly_income=request.monthly_income,
        monthly_expenses=request.monthly_expenses,
        goal_amount=request.goal_amount,
        months=request.months,
        status=simulation_result["status"]
    )

    # 3️⃣ Generate AI insight (internal call)
    ai_insight = generate_ai_insight(ai_input)

    # 4️⃣ Return combined response
    return {
        "simulation": simulation_result,
        "ai_insight": ai_insight
    }
    
