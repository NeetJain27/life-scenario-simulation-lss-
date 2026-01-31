const API_BASE = "http://localhost:8000";

export async function simulateLifeScenario(payload) {
  const response = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
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

// ✅ ADD THIS FUNCTION
export async function fetchSimulationHistory() {
  const response = await fetch(`${API_BASE}/history`, {
    credentials: "include",
  });

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch history");
  }

  return await response.json();
}
