import { useState } from "react";
import InputForm from "./components/InputForm";
import ResultsPanel from "./components/ResultsPanel";
import Login from "./components/Login";
import { simulateLifeScenario } from "./api/simulate";
import "./App.css";

export default function App() {
  const [isAuthed, setIsAuthed] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
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

    // ✅ Input validation
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

    setError("");

    try {
      setIsLoading(true);

      const result = await simulateLifeScenario(payload);

      setResultData(result.simulation);
      setAiInsight(result.ai_insight);
      setShowResults(true);
    } catch (err) {
      if (err.message === "Not authenticated") {
        setError("Session expired. Please log in again.");
        return;
      } else {
        setError(
          "Unable to reach the server. Please check your connection and try again."
        );
      }
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  }

  // 🔐 AUTH GATE
  if (!isAuthed) {
    return <Login onAuth={() => setIsAuthed(true)} />;
  }

  return (
    <div className="app">
      <h1>Life Scenario Simulator</h1>

      <p className="app-description">
        Enter your monthly income, expenses, target amount, and time period to
        see if you are on track to reach your financial goal.
      </p>

      <div className="layout">
        <InputForm onSimulate={handleSimulate} isLoading={isLoading} />

        {error && <p style={{ color: "red" }}>{error}</p>}

        {showResults && (
          <ResultsPanel result={resultData} aiInsight={aiInsight} />
        )}
      </div>
    </div>
  );
}
