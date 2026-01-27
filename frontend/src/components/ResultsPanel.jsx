export default function ResultsPanel({ result, aiInsight }) {
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
            ✅ Based on your current income and expenses, you can continue
            with your existing plan and still reach your goal.
          </strong>
        ) : (
          <strong>
            ⚠️ With your current income and expenses, you may need to
            adjust your spending, increase income, or extend your timeline.
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

      {/* ✅ AI Insight Section (NOW INSIDE RETURN) */}
      {aiInsight && (
        <div
          className="ai-insight"
          style={{
            marginTop: "24px",
            padding: "16px",
            borderRadius: "8px",
            backgroundColor: "#f6f9ff",
            borderLeft: `6px solid ${
              aiInsight.risk_level === "high"
                ? "red"
                : aiInsight.risk_level === "medium"
                ? "orange"
                : "green"
            }`,
          }}
        >
          <h3>🤖 AI Financial Insight</h3>

          <p style={{ marginBottom: "12px" }}>
            {aiInsight.insight}
          </p>

          <p>
            <strong>Risk Level:</strong>{" "}
            <span
              style={{
                color:
                  aiInsight.risk_level === "high"
                    ? "red"
                    : aiInsight.risk_level === "medium"
                    ? "orange"
                    : "green",
                fontWeight: "bold",
              }}
            >
              {aiInsight.risk_level.toUpperCase()}
            </span>
          </p>

          <p>
            <strong>Confidence:</strong>{" "}
            {Math.round(aiInsight.confidence * 100)}%
          </p>

          {aiInsight.recommendations?.length > 0 && (
            <>
              <h4 style={{ marginTop: "12px" }}>
                AI Recommendations
              </h4>
              <ul>
                {aiInsight.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
