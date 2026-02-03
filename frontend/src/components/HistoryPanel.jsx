export default function HistoryPanel({
  history = [],
  selectedKey,
  onSelect,
  onDelete, // 🆕 NEW PROP
}) {
  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>Simulation History</h3>

      {history.length === 0 && (
        <p>No previous simulations yet.</p>
      )}

      {history.map((item) => {
        const key = `${item.created_at}-${item.monthly_income}-${item.goal_amount}`;
        const isSelected = key === selectedKey;

        return (
          <div
            key={key}
            onClick={() => onSelect(item)}
            style={{
              border: isSelected ? "2px solid #4f46e5" : "1px solid #ddd",
              padding: "1rem",
              marginBottom: "0.75rem",
              borderRadius: "6px",
              background: isSelected ? "#eef2ff" : "#fafafa",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.15s ease",
            }}
          >
            {/* 🗑 DELETE BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // 🔴 IMPORTANT
                onDelete(item.id);
              }}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#dc2626",
                fontSize: "16px",
                fontWeight: "bold",
              }}
              title="Delete simulation"
            >
              ✕
            </button>

            <p>Income: ₹{item.monthly_income}</p>
            <p>Expenses: ₹{item.monthly_expenses}</p>
            <p>Goal: ₹{item.goal_amount}</p>
            <p>Months: {item.months}</p>
            <small style={{ color: "#666" }}>
              {new Date(item.created_at).toLocaleString()}
            </small>
          </div>
        );
      })}
    </div>
  );
}
