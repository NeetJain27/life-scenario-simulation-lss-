import sqlite3
from backend.core.config import settings

DB_PATH = settings.DATABASE_PATH

def get_connection():
    connection = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA journal_mode = WAL")
    return connection
