from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from backend.auth.db import get_connection
from backend.auth.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(data: RegisterRequest):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (email, hashed_password) VALUES (?, ?)",
            (data.email, hash_password(data.password))
        )
        conn.commit()
    except Exception:
        raise HTTPException(status_code=400, detail="Email already registered")
    finally:
        conn.close()

    return {"message": "User registered successfully"}


@router.post("/login")
def login(data: LoginRequest, response: Response):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, hashed_password FROM users WHERE email = ?",
        (data.email,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row or not verify_password(data.password, row[1]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user_id=row[0])

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax"
    )

    return {"message": "Login successful"}
