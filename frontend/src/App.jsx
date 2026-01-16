import { useState } from "react";
import InputForm from "./components/InputForm";
import ResultsPanel from "./components/ResultsPanel";
import "./App.css";

export default function App() {
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState(null);

  function handleSimulate(data) {
    setFormData(data);
    setShowResults(true);
  }

  return (
    <div className="app">
      <h1>Life Scenario Simulator</h1>
      <div className="layout">
        <InputForm onSimulate={handleSimulate} />
        {showResults && <ResultsPanel userData={formData} />}
      </div>
    </div>
  );
}
