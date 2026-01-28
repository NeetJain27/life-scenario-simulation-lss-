# backend/memory/store.py

from collections import defaultdict
from typing import List, Dict

# In-memory store (session-based for now)
_memory_store: Dict[str, List[dict]] = defaultdict(list)

MAX_HISTORY = 5  # keep last 5 simulations


def add_simulation(session_id: str, simulation: dict):
    """
    Store a simulation result for a session/user
    """
    _memory_store[session_id].append(simulation)

    # keep only last N entries
    if len(_memory_store[session_id]) > MAX_HISTORY:
        _memory_store[session_id] = _memory_store[session_id][-MAX_HISTORY:]
    print(f"[MEMORY] Stored {len(_memory_store[session_id])} simulations for {session_id}")

def get_simulation_history(session_id: str) -> List[dict]:
    """
    Get past simulations for a session/user
    """
    return _memory_store.get(session_id, [])
