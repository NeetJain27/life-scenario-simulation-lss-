from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/ai", tags=["AI"])


# ----------- Request Schema -----------

class SimulationInput(BaseModel):
    monthly_income: float
    monthly_expenses: float
    goal_amount: float
    months: int
    status: str  # "on_track" or "off_track"


# ----------- Response Schema -----------

class AIInsightResponse(BaseModel):
    insight: str
    risk_level: str  # low | medium | high
    confidence: float
    recommendations: List[str]


# ----------- AI Insights Endpoint -----------

@router.post("/insights", response_model=AIInsightResponse)
def generate_ai_insight(data: SimulationInput):
    """
    MOCK AI INSIGHT GENERATOR (v1)
    This will later be replaced by a real LLM call.
    """

    if data.status == "on_track":
        return {
            "insight": (
                "You are currently on track to reach your financial goal, "
                "but maintaining consistent savings is crucial to stay aligned."
            ),
            "risk_level": "low",
            "confidence": 0.78,
            "recommendations": [
                "Continue your current savings strategy",
                "Build a small emergency buffer for unexpected expenses"
            ]
        }

    return {
        "insight": (
            "With your current income and expenses, you are unlikely to reach "
            "your goal within the selected time frame."
        ),
        "risk_level": "high",
        "confidence": 0.86,
        "recommendations": [
            "Reduce monthly expenses where possible",
            "Consider extending your goal timeline",
            "Look for opportunities to increase income"
        ]
    }
