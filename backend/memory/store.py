from backend.memory.db import get_connection

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS simulations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            monthly_income REAL NOT NULL,
            monthly_expenses REAL NOT NULL,
            goal_amount REAL NOT NULL,
            months INTEGER NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 🔹 Optional but recommended for performance
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_simulations_user_id
        ON simulations (user_id)
    """)

    conn.commit()
    conn.close()


def add_simulation(user_id: int, simulation: dict):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO simulations (
            user_id,
            monthly_income,
            monthly_expenses,
            goal_amount,
            months,
            status
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        simulation["monthly_income"],
        simulation["monthly_expenses"],
        simulation["goal_amount"],
        simulation["months"],
        simulation["status"]
    ))

    conn.commit()
    conn.close()


def get_user_simulations(user_id: int, limit: int = 10):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            monthly_income,
            monthly_expenses,
            goal_amount,
            months,
            status,
            created_at
        FROM simulations
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, (user_id, limit))

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "monthly_income": r[0],
            "monthly_expenses": r[1],
            "goal_amount": r[2],
            "months": r[3],
            "status": r[4],
            "created_at": r[5],
        }
        for r in rows
    ]
