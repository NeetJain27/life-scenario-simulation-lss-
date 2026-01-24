export default function ResultsPanel({ result }) {
  if (!result) return null;

  const { status, severity, summary, metrics, actions } = result;

  return (
    <div className="results-panel">
      {/* Overall Status */}
      <h2
        style={{
          color:
            status === "on_track"
              ? "green"
              : severity === "medium"
              ? "orange"
              : "red",
        }}
      >
        {status === "on_track"
          ? "You are on track to reach your goal ✅"
          : "You are currently off track ⚠️"}
      </h2>

      {/* Summary */}
      <p style={{ fontWeight: "bold", marginBottom: "12px" }}>
        {summary}
      </p>

      {/* Decision Guidance */}
      <p style={{ marginBottom: "16px" }}>
        {status === "on_track" ? (
          <strong>
            ✅ Based on your current income and expenses, you can
            continue with your existing plan and still reach your goal.
          </strong>
        ) : (
          <strong>
            ⚠️ With your current income and expenses, you may need to
            adjust your spending, increase income, or extend your
            timeline to reach this goal.
          </strong>
        )}
      </p>

      {/* Financial Breakdown */}
      <div className="metrics">
        <h3>Financial Breakdown</h3>

        <p>
          <strong>Current Monthly Saving:</strong> ₹
          {metrics.current_monthly_saving}
        </p>

        <p>
          <strong>Required Monthly Saving:</strong> ₹
          {metrics.required_monthly_saving}
        </p>

        {metrics.shortfall > 0 && (
          <p>
            <strong>Monthly Shortfall:</strong> ₹{metrics.shortfall}
          </p>
        )}
      </div>

      {/* Recommended Actions */}
      {actions.length > 0 && (
        <div className="actions">
          <h3>What you can do next</h3>
          <ul>
            {actions.map((action, index) => (
              <li key={index}>{action.label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
