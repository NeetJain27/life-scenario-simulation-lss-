import { useEffect, useState } from "react";
import InputForm from "./components/InputForm";
import ResultsPanel from "./components/ResultsPanel";
import Login from "./components/Login";
import HistoryPanel from "./components/HistoryPanel";
import {
  simulateLifeScenario,
  fetchSimulationHistory,
  deleteSimulation, // ✅ ADD
} from "./api/simulate";
import { getMe, logout } from "./api/auth";
import "./App.css";

export default function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [formData, setFormData] = useState({
    monthly_income: "",
    monthly_expenses: "",
    goal_amount: "",
    months: "",
  });

  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistoryKey, setSelectedHistoryKey] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔐 SESSION + HISTORY
  useEffect(() => {
    async function checkSession() {
      try {
        await getMe();
        setIsAuthed(true);
        setHistory(await fetchSimulationHistory());
      } catch {
        setIsAuthed(false);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  // 🚪 LOGOUT
  async function handleLogout() {
    await logout();
    setIsAuthed(false);
    setFormData({
      monthly_income: "",
      monthly_expenses: "",
      goal_amount: "",
      months: "",
    });
    setShowResults(false);
    setResultData(null);
    setAiInsight(null);
    setHistory([]);
    setSelectedHistoryKey(null);
    setError("");
  }

  async function handleSimulate() {
    const payload = {
      monthly_income: Number(formData.monthly_income),
      monthly_expenses: Number(formData.monthly_expenses),
      goal_amount: Number(formData.goal_amount),
      months: Number(formData.months),
      starting_savings: 0,
    };

    if (
      payload.monthly_income <= 0 ||
      payload.monthly_expenses < 0 ||
      payload.goal_amount <= 0 ||
      payload.months <= 0
    ) {
      setError("Please enter valid positive numbers.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const result = await simulateLifeScenario(payload);
      setResultData(result.simulation);
      setAiInsight(result.ai_insight);
      setShowResults(true);
      setHistory(await fetchSimulationHistory());
    } catch {
      setError("Unable to simulate.");
    } finally {
      setIsLoading(false);
    }
  }

  // 📝 HISTORY CLICK → PREFILL
  function handleHistorySelect(item) {
    const key = `${item.created_at}-${item.monthly_income}-${item.goal_amount}`;
    setSelectedHistoryKey(key);

    setFormData({
      monthly_income: item.monthly_income,
      monthly_expenses: item.monthly_expenses,
      goal_amount: item.goal_amount,
      months: item.months,
    });

    setShowResults(false);
  }

  // 🗑 DELETE HISTORY ITEM
  async function handleDeleteHistory(id) {
    const ok = window.confirm("Delete this simulation?");
    if (!ok) return;

    await deleteSimulation(id);
    setHistory(history.filter(h => h.id !== id));
    setSelectedHistoryKey(null);
  }

  if (checkingSession) return <p>Checking session…</p>;
  if (!isAuthed) return <Login onAuth={() => setIsAuthed(true)} />;

  return (
    <div className="app">
      <button onClick={handleLogout} style={{ float: "right" }}>
        Logout
      </button>

      <div className="layout">
        {/* LEFT */}
        <div className="left">
          <InputForm
            formData={formData}
            setFormData={setFormData}
            onSimulate={handleSimulate}
            isLoading={isLoading}
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          {showResults && (
            <ResultsPanel result={resultData} aiInsight={aiInsight} />
          )}
        </div>

        {/* RIGHT */}
        <div className="right">
          <HistoryPanel
            history={history}
            selectedKey={selectedHistoryKey}
            onSelect={handleHistorySelect}
            onDelete={handleDeleteHistory} // ✅ ADD
          />
        </div>
      </div>
    </div>
  );
}
