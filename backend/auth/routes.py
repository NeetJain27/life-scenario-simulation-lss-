from fastapi import APIRouter, HTTPException, Response, Request, Depends
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.auth.db import get_connection
from backend.auth.security import hash_password, verify_password, create_access_token
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

# 🔐 Rate limiter for auth routes
limiter = Limiter(key_func=get_remote_address)


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# 🔐 Protect Register (5 attempts per minute)
@router.post("/register")
@limiter.limit("5/minute")
def register(request: Request, data: RegisterRequest):
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


# 🔐 Protect Login (5 attempts per minute)
@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, data: LoginRequest, response: Response):
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
        samesite="none",
        secure=True,
        path="/"
    )

    return {"message": "Login successful"}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"]
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        path="/"
    )
    return {"message": "Logged out"}
