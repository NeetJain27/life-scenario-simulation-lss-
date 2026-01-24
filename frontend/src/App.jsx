import { useState } from "react";
import InputForm from "./components/InputForm";
import ResultsPanel from "./components/ResultsPanel";
import { simulateLifeScenario } from "./api/simulate";
import "./App.css";

export default function App() {
  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSimulate(data) {
    const payload = {
      monthly_income: Number(data.monthly_income),
      monthly_expenses: Number(data.monthly_expenses),
      goal_amount: Number(data.goal_amount),
      months: Number(data.months),
      starting_savings: 0,
    };

    // ✅ INPUT VALIDATION
    if (
      !payload.monthly_income ||
      !payload.monthly_expenses ||
      !payload.goal_amount ||
      !payload.months
    ) {
      setError("All fields are required.");
      setShowResults(false);
      return;
    }

    if (
      payload.monthly_income <= 0 ||
      payload.monthly_expenses < 0 ||
      payload.goal_amount <= 0 ||
      payload.months <= 0
    ) {
      setError("Please enter valid positive numbers.");
      setShowResults(false);
      return;
    }

    // Clear error if validation passes
    setError("");

    try {
      setIsLoading(true);

      const result = await simulateLifeScenario(payload);

      setResultData(result);
      setShowResults(true);
    } catch (err) {
      console.error("Simulation failed:", err);
      setError("Unable to reach the server. Please check your connection and try again.");
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      <h1>Life Scenario Simulator</h1>

      <div className="layout">
        <InputForm
          onSimulate={handleSimulate}
          isLoading={isLoading}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        {showResults && <ResultsPanel result={resultData} />}
      </div>
    </div>
  );
}
