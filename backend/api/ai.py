from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from backend.memory.store import get_simulation_history


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
def generate_ai_insight(data: SimulationInput, user_id: int):
    """
    MEMORY-AWARE AI INSIGHT GENERATOR (v2)
    Uses past simulations to generate contextual advice.
    """

    history = get_simulation_history(user_id)

    insight_lines = []
    recommendations = []

    # ---------------- MEMORY ANALYSIS ----------------

    # 1️⃣ Repeated off-track pattern
    off_track_count = sum(1 for h in history if h["status"] == "off_track")

    if off_track_count >= 3:
        insight_lines.append(
            f"You have been off track in {off_track_count} recent simulations, "
            "which suggests a recurring financial pattern."
        )
        recommendations.append(
            "Consider making a significant adjustment to expenses or income rather than small changes."
        )

    # 2️⃣ Expense trend detection
    if len(history) >= 2:
        last = history[-1]
        prev = history[-2]

        if last["monthly_expenses"] > prev["monthly_expenses"]:
            insight_lines.append(
                "Your monthly expenses have increased compared to your previous simulation."
            )
            recommendations.append(
                "Review recent spending increases and identify non-essential expenses."
            )

    # ---------------- CURRENT STATE ----------------

    if data.status == "on_track":
        insight_lines.append(
            "You are currently on track to reach your financial goal."
        )
        risk_level = "low"
    else:
        insight_lines.append(
            "With your current income and expenses, you are unlikely to reach your goal on time."
        )
        risk_level = "high"

    # ---------------- FALLBACK ----------------

    if not insight_lines:
        insight_lines.append(
            "Your financial situation appears stable, but continued monitoring is recommended."
        )
        risk_level = "medium"

    return {
        "insight": " ".join(insight_lines),
        "risk_level": risk_level,
        "confidence": round(0.6 + min(len(history) * 0.05, 0.3), 2),
        "recommendations": recommendations
    }