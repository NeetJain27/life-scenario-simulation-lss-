from core import calculate_monthly_cash_flow,simulate_monthly_savings,can_reach_goal,required_monthly_saving,saving_status

def run_tests():
    print("Test 1: Positive cash flow")
    result = calculate_monthly_cash_flow(50000, 40000)
    print("Expected: 10000, Got:", result)

    print("\nTest 2: Zero cash flow")
    result = calculate_monthly_cash_flow(30000, 30000)
    print("Expected: 0, Got:", result)

    print("\nTest 3: Negative cash flow")
    result = calculate_monthly_cash_flow(25000, 30000)
    print("Expected: -5000, Got:", result)

    print("\nTest 4: Multi-month savings simulation")
    timeline = simulate_monthly_savings(
        monthly_income=50000,
        monthly_expenses=40000,
        months=6,
        starting_savings=0
    )
    print("Expected: [10000, 20000, 30000, 40000, 50000, 60000]")
    print("Got:", timeline)

    print("\nTest 5: Goal feasibility check")
    result = can_reach_goal(
        monthly_income=50000,
        monthly_expenses=40000,
        months=6,
        goal_amount=60000,
        starting_savings=0
    )
    print("Expected: True")
    print("Got:", result)

    print("\nTest 6: Required monthly saving calculation")
    required = required_monthly_saving(
        goal_amount=60000,
        months=6,
        starting_savings=0
    )
    print("Expected: 10000")
    print("Got:", required)

    print("\nTest 7: Saving status check")
    status = saving_status(
        monthly_income=50000,
        monthly_expenses=40000,
        goal_amount=60000,
        months=6,
        starting_savings=0
    )
    print("Expected on_track: True")
    print("Got:", status)





if __name__ == "__main__":
    run_tests()
