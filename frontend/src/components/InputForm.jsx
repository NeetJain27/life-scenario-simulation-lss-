export default function InputForm({
  formData,
  setFormData,
  onSimulate,
  isLoading,
}) {
  const isFormValid =
    Number(formData.monthly_income) > 0 &&
    Number(formData.monthly_expenses) >= 0 &&
    Number(formData.goal_amount) > 0 &&
    Number(formData.months) > 0;

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <div>
      <h2>Enter Your Details</h2>

      <input
        name="monthly_income"
        placeholder="Monthly Income"
        value={formData.monthly_income}
        onChange={handleChange}
      />
      <br /><br />

      <input
        name="monthly_expenses"
        placeholder="Monthly Expenses"
        value={formData.monthly_expenses}
        onChange={handleChange}
      />
      <br /><br />

      <input
        name="goal_amount"
        placeholder="Goal Amount"
        value={formData.goal_amount}
        onChange={handleChange}
      />
      <br /><br />

      <input
        name="months"
        placeholder="Time (months)"
        value={formData.months}
        onChange={handleChange}
      />
      <br /><br />

      <button
        onClick={onSimulate}
        disabled={isLoading || !isFormValid}
        style={{
          opacity: isLoading || !isFormValid ? 0.6 : 1,
          cursor: isLoading || !isFormValid ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "Simulating..." : "Simulate"}
      </button>
    </div>
  );
}
