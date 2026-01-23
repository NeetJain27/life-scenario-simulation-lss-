export default function ResultsPanel({ result }) {
  if (!result) return null;

  const { status, severity, summary, metrics, actions } = result;

  return (
    <div className="results-panel">
      {/* Status */}
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
        {status === "on_track" ? "On Track ✅" : "Off Track ⚠️"}
      </h2>

      {/* Summary */}
      <p>{summary}</p>

      {/* Metrics */}
      <div className="metrics">
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
            <strong>Shortfall:</strong> ₹{metrics.shortfall}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="actions">
          <h3>Recommended Actions</h3>
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
