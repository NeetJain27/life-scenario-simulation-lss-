from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel

from simulator.core import build_api_response

app = FastAPI(title="Life Scenario Simulator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    monthly_income: float
    monthly_expenses: float
    goal_amount: float
    months: int
    starting_savings: float = 0


@app.post("/simulate")
def simulate_life_scenario(request: SimulationRequest):
    response = build_api_response(
        monthly_income=request.monthly_income,
        monthly_expenses=request.monthly_expenses,
        goal_amount=request.goal_amount,
        months=request.months,
        starting_savings=request.starting_savings
    )
    return response
