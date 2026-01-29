import sqlite3

DB_PATH = "backend/memory/memory.db"

def get_connection():
    return sqlite3.connect(DB_PATH, check_same_thread=False)
