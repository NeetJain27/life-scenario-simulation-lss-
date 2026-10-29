from backend.memory.db import get_connection

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL CHECK(amount > 0),
            transaction_type TEXT NOT NULL CHECK(transaction_type IN ('Income', 'Expense')),
            payment_method TEXT NOT NULL,
            transaction_date TEXT NOT NULL,
            import_source TEXT NOT NULL DEFAULT 'manual',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC)")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            category TEXT NOT NULL,
            month TEXT NOT NULL,
            amount REAL NOT NULL CHECK(amount > 0),
            UNIQUE(user_id, category, month)
        )
    """)

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


def list_transactions(user_id: int, category=None, payment_method=None, start_date=None, end_date=None, search=None):
    query = "SELECT id,title,category,amount,transaction_type,payment_method,transaction_date,import_source FROM transactions WHERE user_id=?"
    params = [user_id]
    for column, value in (("category", category), ("payment_method", payment_method)):
        if value:
            query += f" AND {column}=?"
            params.append(value)
    if start_date:
        query += " AND transaction_date>=?"
        params.append(start_date)
    if end_date:
        query += " AND transaction_date<=?"
        params.append(end_date)
    if search:
        query += " AND (title LIKE ? OR category LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    query += " ORDER BY transaction_date DESC, id DESC LIMIT 500"
    conn = get_connection()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def create_transaction(user_id: int, data: dict):
    conn = get_connection()
    cur = conn.execute("INSERT INTO transactions(user_id,title,category,amount,transaction_type,payment_method,transaction_date,import_source) VALUES(?,?,?,?,?,?,?,?)", (user_id,data["title"],data["category"],data["amount"],data["type"],data["method"],data["date"],data.get("import_source","manual")))
    conn.commit()
    transaction_id = cur.lastrowid
    conn.close()
    return transaction_id


def update_transaction(user_id: int, transaction_id: int, data: dict):
    conn = get_connection()
    cur = conn.execute("UPDATE transactions SET title=?,category=?,amount=?,transaction_type=?,payment_method=?,transaction_date=? WHERE id=? AND user_id=?", (data["title"],data["category"],data["amount"],data["type"],data["method"],data["date"],transaction_id,user_id))
    conn.commit()
    changed = cur.rowcount
    conn.close()
    return changed


def delete_transaction(user_id: int, transaction_id: int):
    conn = get_connection()
    cur = conn.execute("DELETE FROM transactions WHERE id=? AND user_id=?", (transaction_id,user_id))
    conn.commit()
    changed = cur.rowcount
    conn.close()
    return changed


def list_budgets(user_id: int, month: str):
    conn = get_connection()
    rows = conn.execute("SELECT category,amount,month FROM budgets WHERE user_id=? AND month=? ORDER BY category", (user_id,month)).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def save_budget(user_id: int, category: str, month: str, amount: float):
    conn = get_connection()
    conn.execute("INSERT INTO budgets(user_id,category,month,amount) VALUES(?,?,?,?) ON CONFLICT(user_id,category,month) DO UPDATE SET amount=excluded.amount", (user_id,category,month,amount))
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
            id,
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
            "id": r[0],
            "monthly_income": r[1],
            "monthly_expenses": r[2],
            "goal_amount": r[3],
            "months": r[4],
            "status": r[5],
            "created_at": r[6],
        }
        for r in rows
    ]

def delete_simulation(simulation_id: int, user_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM simulations
        WHERE id = ? AND user_id = ?
    """, (simulation_id, user_id))

    conn.commit()
    conn.close()
