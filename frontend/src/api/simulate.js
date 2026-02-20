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
  const errorData = await response.json();

  if (Array.isArray(errorData.detail)) {
    const message = errorData.detail
      .map(err => err.msg)
      .join(", ");
    throw new Error(message);
  }

  throw new Error(errorData.detail || "Backend request failed");
}

  return await response.json();
}


export async function fetchSimulationHistory() {
  const response = await fetch(`${API_BASE}/history`, {
    credentials: "include",
  });

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch history");
  }

  return await response.json();
}


export async function deleteSimulation(id) {
  const res = await fetch(`${API_BASE}/history/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to delete simulation");
  }
}