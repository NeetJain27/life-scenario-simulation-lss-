def calculate_monthly_cash_flow(monthly_income, monthly_expenses):
    """
    Calculate how much money is left at the end of the month.

    Args:
        monthly_income (float): Total income for the month
        monthly_expenses (float): Total expenses for the month

    Returns:
        float: Monthly cash flow (income - expenses)
    """
    return monthly_income - monthly_expenses

def simulate_monthly_savings(
    monthly_income,
    monthly_expenses,
    months,
    starting_savings=0
):
    """
    Simulate savings over multiple months.

    Args:
        monthly_income (float): Income per month
        monthly_expenses (float): Expenses per month
        months (int): Number of months to simulate
        starting_savings (float): Initial savings amount

    Returns:
        list: Savings amount at the end of each month
    """
    savings = starting_savings
    savings_timeline = []

    for month in range(1, months + 1):
        cash_flow = calculate_monthly_cash_flow(
            monthly_income,
            monthly_expenses
        )
        savings += cash_flow
        savings_timeline.append(savings)

    return savings_timeline

def can_reach_goal(
    monthly_income,
    monthly_expenses,
    months,
    goal_amount,
    starting_savings=0
):
    """
    Check whether a savings goal can be reached within a given time.

    Args:
        monthly_income (float): Income per month
        monthly_expenses (float): Expenses per month
        months (int): Number of months available
        goal_amount (float): Target savings amount
        starting_savings (float): Initial savings

    Returns:
        bool: True if goal can be reached, False otherwise
    """
    savings_timeline = simulate_monthly_savings(
        monthly_income,
        monthly_expenses,
        months,
        starting_savings
    )

    final_savings = savings_timeline[-1]
    return final_savings >= goal_amount

def required_monthly_saving(
    goal_amount,
    months,
    starting_savings=0
):
    """
    Calculate how much money needs to be saved per month
    to reach a financial goal.

    Args:
        goal_amount (float): Target savings amount
        months (int): Number of months available
        starting_savings (float): Initial savings

    Returns:
        float: Required monthly saving amount
    """
    if months <= 0:
        raise ValueError("Months must be greater than zero")

    remaining_amount = goal_amount - starting_savings
    return remaining_amount / months

def saving_status(
    monthly_income,
    monthly_expenses,
    goal_amount,
    months,
    starting_savings=0
):
    """
    Compare current monthly saving with required monthly saving.

    Args:
        monthly_income (float): Income per month
        monthly_expenses (float): Expenses per month
        goal_amount (float): Target savings amount
        months (int): Time available
        starting_savings (float): Initial savings

    Returns:
        dict: Status of saving with details
    """
    current_saving = calculate_monthly_cash_flow(
        monthly_income,
        monthly_expenses
    )

    required_saving = required_monthly_saving(
        goal_amount,
        months,
        starting_savings
    )

    return {
        "current_monthly_saving": current_saving,
        "required_monthly_saving": required_saving,
        "on_track": current_saving >= required_saving,
        "shortfall": max(0, required_saving - current_saving)
    }

def generate_recommendations(
    monthly_income,
    monthly_expenses,
    goal_amount,
    months,
    starting_savings=0
):
    """
    Generate actionable recommendations to reach a financial goal.

    Returns:
        dict: Recommendations for the user
    """
    status = saving_status(
        monthly_income,
        monthly_expenses,
        goal_amount,
        months,
        starting_savings
    )

    if status["on_track"]:
        return {
            "status": "on_track",
            "message": "You are on track to reach your goal. No changes needed."
        }

    shortfall = status["shortfall"]

    return {
        "status": "off_track",
        "message": "You are not on track to reach your goal.",
        "recommendations": {
            "reduce_expenses_by": shortfall,
            "increase_income_by": shortfall
        }
    }

def format_recommendation_response(
    monthly_income,
    monthly_expenses,
    goal_amount,
    months,
    starting_savings=0
):
    """
    Format recommendations into a frontend-friendly response.
    """
    rec = generate_recommendations(
        monthly_income,
        monthly_expenses,
        goal_amount,
        months,
        starting_savings
    )

    if rec["status"] == "on_track":
        return {
            "status": "on_track",
            "severity": "low",
            "summary": rec["message"],
            "actions": []
        }

    shortfall = rec["recommendations"]["reduce_expenses_by"]

    return {
        "status": "off_track",
        "severity": "medium",
        "summary": rec["message"],
        "actions": [
            {
                "type": "reduce_expenses",
                "amount": shortfall,
                "label": f"Reduce monthly expenses by ₹{shortfall}"
            },
            {
                "type": "increase_income",
                "amount": shortfall,
                "label": f"Increase monthly income by ₹{shortfall}"
            }
        ]
    }

def build_api_response(
    monthly_income,
    monthly_expenses,
    goal_amount,
    months,
    starting_savings=0
):
    """
    Build a complete API-ready response for the frontend.
    """
    formatted = format_recommendation_response(
        monthly_income,
        monthly_expenses,
        goal_amount,
        months,
        starting_savings
    )

    status = saving_status(
        monthly_income,
        monthly_expenses,
        goal_amount,
        months,
        starting_savings
    )

    return {
        **formatted,
        "metrics": {
            "current_monthly_saving": status["current_monthly_saving"],
            "required_monthly_saving": status["required_monthly_saving"],
            "shortfall": status["shortfall"]
        }
    }
