from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer


import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv

from backend.database import SessionLocal
from backend.models.users import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not configured")


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise ValueError("Missing user ID")

        return int(user_id)

    except (jwt.InvalidTokenError, ValueError):
        raise ValueError("Invalid or expired token")

def get_current_user_id(
    token: str = Depends(oauth2_scheme)
) -> int:
    try:
        user_id = decode_access_token(token)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    db = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(User.user_id == user_id)
            .first()
        )

        if not user or not user.is_active:
            raise HTTPException(
                status_code=401,
                detail="User account is inactive or unavailable",
                headers={"WWW-Authenticate": "Bearer"}
            )

        return user_id
    finally:
        db.close()

def require_admin(
    user_id: int = Depends(get_current_user_id)
) -> int:
    db = SessionLocal()

    try:
        user = (
            db.query(User)
            .filter(User.user_id == user_id)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        if user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )

        return user_id

    finally:
        db.close()