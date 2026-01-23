import { useState } from "react";
import InputForm from "./components/InputForm";
import ResultsPanel from "./components/ResultsPanel";
import { simulateLifeScenario } from "./api/simulate";
import "./App.css";

export default function App() {
  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  async function handleSimulate(data) {
  const payload = {
    monthly_income: Number(data.monthly_income),
    monthly_expenses: Number(data.monthly_expenses),
    goal_amount: Number(data.goal_amount),
    months: Number(data.months),
    starting_savings: 0
  };

  console.log("Payload sent to backend:", payload);

  try {
    setIsLoading(true);
    const result = await simulateLifeScenario(payload);
    console.log("Backend response:", result);
    setResultData(result);
    setShowResults(true);
  } catch (error) {
    console.error("Simulation failed:", error);
  }finally {
    setIsLoading(false); // 🔴 STOP loading
  }
}



  return (
    <div className="app">
      <h1>Life Scenario Simulator</h1>
      <div className="layout">
        <InputForm onSimulate={handleSimulate} />
        {showResults && <ResultsPanel result={resultData} />}
      </div>
    </div>
  );
}
