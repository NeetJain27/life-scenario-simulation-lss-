from backend.memory.db import get_connection

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS simulations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            monthly_income REAL,
            monthly_expenses REAL,
            goal_amount REAL,
            months INTEGER,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def add_simulation(user_id: int, simulation: dict):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO simulations (
            session_id,
            monthly_income,
            monthly_expenses,
            goal_amount,
            months,
            status
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, (
        str(user_id),
        simulation["monthly_income"],
        simulation["monthly_expenses"],
        simulation["goal_amount"],
        simulation["months"],
        simulation["status"]
    ))

    conn.commit()
    conn.close()


def get_simulation_history(user_id: int, limit: int = 5):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT monthly_income, monthly_expenses, goal_amount, months, status
        FROM simulations
        WHERE session_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, (str(user_id), limit))

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "monthly_income": r[0],
            "monthly_expenses": r[1],
            "goal_amount": r[2],
            "months": r[3],
            "status": r[4]
        }
        for r in reversed(rows)
    ]
