import { mockSavingStatus, mockSavingsTimeline } from "../mock/data";
import SavingsChart from "./SavingsChart";

export default function ResultsPanel({ userData }) {
  const data = mockSavingStatus;

  return (
    <div>
      <h2>Results</h2>

      <p>Status: {data.on_track ? "On Track 🎯" : "Not On Track ⚠️"}</p>
      <p>Current Saving: ₹{data.current_monthly_saving}</p>
      <p>Required Saving: ₹{data.required_monthly_saving}</p>
      {!data.on_track && <p>Shortfall: ₹{data.shortfall}</p>}

      <SavingsChart data={mockSavingsTimeline} />
    </div>
  );
}
