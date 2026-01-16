import { useState } from "react";

export default function InputForm({ onSimulate }) {
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [goal, setGoal] = useState("");
  const [months, setMonths] = useState("");

  function handleSimulate() {
   const data = {
    income,
    expenses,
    goal,
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
        value={income}
        onChange={(e) => setIncome(e.target.value)}
      /><br /><br />

      <input
        placeholder="Monthly Expenses"
        value={expenses}
        onChange={(e) => setExpenses(e.target.value)}
      /><br /><br />

      <input
        placeholder="Goal Amount"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      /><br /><br />

      <input
        placeholder="Time (months)"
        value={months}
        onChange={(e) => setMonths(e.target.value)}
      /><br /><br />

      <button onClick={handleSimulate}>Simulate</button>
    </div>
  );
}
