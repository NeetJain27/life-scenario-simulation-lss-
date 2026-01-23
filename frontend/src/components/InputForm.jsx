import { useState } from "react";

export default function InputForm({ onSimulate, isLoading }) {
  const [monthly_income, setIncome] = useState("");
  const [monthly_expenses, setExpenses] = useState("");
  const [goal_amount, setGoal] = useState("");
  const [months, setMonths] = useState("");

  function handleSimulate() {
    const data = {
      monthly_income,
      monthly_expenses,
      goal_amount,
      months,
    };

    console.log("Sending to App:", data);
    onSimulate(data);
  }

  return (
    <div>
      <h2>Enter Your Details</h2>

      <input
        placeholder="Monthly Income"
        value={monthly_income}
        onChange={(e) => setIncome(e.target.value)}
      /><br /><br />

      <input
        placeholder="Monthly Expenses"
        value={monthly_expenses}
        onChange={(e) => setExpenses(e.target.value)}
      /><br /><br />

      <input
        placeholder="Goal Amount"
        value={goal_amount}
        onChange={(e) => setGoal(e.target.value)}
      /><br /><br />

      <input
        placeholder="Time (months)"
        value={months}
        onChange={(e) => setMonths(e.target.value)}
      /><br /><br />

      <button onClick={handleSimulate} disabled={isLoading}>
        {isLoading ? "Simulating..." : "Simulate"}
      </button>
    </div>
  );
}
