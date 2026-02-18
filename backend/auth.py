from __future__ import annotations

import os
import sqlite3
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from .models import LoginRequest, SignupRequest, TokenResponse, UserPublic
from .utils import create_jwt, env

router = APIRouter(prefix="/auth", tags=["auth"])

_DB_PATH = os.path.join(os.path.dirname(__file__), "app.db")
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    conn = _get_conn()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def _hash_password(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at most 72 bytes (bcrypt limit)",
        )
    return _pwd_context.hash(password)


def _verify_password(password: str, password_hash: str) -> bool:
    return _pwd_context.verify(password, password_hash)


def _get_user_by_email(email: str) -> Optional[sqlite3.Row]:
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower(),))
        return cur.fetchone()
    finally:
        conn.close()


def _create_user(email: str, password: str) -> sqlite3.Row:
    conn = _get_conn()
    try:
        password_hash = _hash_password(password)
        conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email.lower(), password_hash),
        )
        conn.commit()
        cur = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower(),))
        row = cur.fetchone()
        if row is None:
            raise RuntimeError("Failed to create user")
        return row
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists",
        )
    finally:
        conn.close()


def _jwt_secret() -> str:
    return env("JWT_SECRET", "dev-secret-change-me")


def _jwt_expires_minutes() -> int:
    raw = os.getenv("JWT_EXPIRES_MINUTES", "1440")
    try:
        return int(raw)
    except ValueError:
        return 1440


@router.on_event("startup")
def _on_startup() -> None:
    _init_db()


@router.post("/signup", response_model=UserPublic)
def signup(payload: SignupRequest) -> UserPublic:
    row = _create_user(payload.email, payload.password)
    return UserPublic(id=int(row["id"]), email=str(row["email"]))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    row = _get_user_by_email(payload.email)
    if row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not _verify_password(payload.password, str(row["password_hash"])):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_jwt(
        payload={"sub": str(row["id"]), "email": str(row["email"])},
        secret=_jwt_secret(),
        expires_minutes=_jwt_expires_minutes(),
    )
    return TokenResponse(access_token=token)


def get_current_user(token: str = Depends(_oauth2_scheme)) -> UserPublic:
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
        sub = payload.get("sub")
        email = payload.get("email")
        if not sub or not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return UserPublic(id=int(sub), email=str(email))
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
