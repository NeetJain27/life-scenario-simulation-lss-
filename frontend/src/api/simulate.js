export async function simulateLifeScenario(payload) {
  const response = await fetch("http://localhost:8000/simulate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ send auth cookie
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (!response.ok) {
    throw new Error("Backend request failed");
  }

  return await response.json();
}
