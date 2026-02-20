from fastapi import Request, HTTPException
from jose import jwt, JWTError
from backend.auth.db import get_connection
from backend.core.config import settings
from backend.auth.security import ALGORITHM

def get_current_user(request: Request):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("user_id"))  # 🔴 FIXED LINE
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {"id": user[0], "email": user[1]}
