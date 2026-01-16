import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function SavingsChart({ data }) {
  const chartData = data.map((value, index) => ({
    month: index + 1,
    savings: value,
  }));

  return (
    <div style={{ width: "100%", height: 240, marginTop: 20 }}>
      <h3>Savings Over Time</h3>
      <LineChart width={400} height={250} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="savings" stroke="#4caf50" />
      </LineChart>
    </div>
  );
}
