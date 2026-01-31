export default function HistoryPanel({ history }) {
  if (history.length === 0) {
    return <p>No previous simulations yet.</p>;
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>Simulation History</h3>

      {history.map((item, idx) => (
        <div
          key={idx}
          style={{
            border: "1px solid #ddd",
            padding: "1rem",
            marginBottom: "0.5rem",
          }}
        >
          <p><strong>Status:</strong> {item.status}</p>
          <p>Income: {item.monthly_income}</p>
          <p>Expenses: {item.monthly_expenses}</p>
          <p>Goal: {item.goal_amount}</p>
          <p>Months: {item.months}</p>
          <small>{item.created_at}</small>
        </div>
      ))}
    </div>
  );
}
