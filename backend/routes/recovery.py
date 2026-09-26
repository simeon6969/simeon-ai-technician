import unicodedata
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field, model_validator
from sqlalchemy.orm import Session
from backend.models.users import User
from backend.models.recovery import AccountRecovery
from backend.routes.users import get_db
from backend.auth import get_current_user_id
from backend.security import hash_password, verify_password

router = APIRouter(prefix='/users/recovery', tags=['Account recovery'])


def normalized(value):
    return ' '.join(unicodedata.normalize('NFKC', value).casefold().split())


class Secret(BaseModel):
    question: str = Field(min_length=8, max_length=200)
    answer: str = Field(min_length=8, max_length=200)

    @model_validator(mode='after')
    def not_blank(self):
        if len(normalized(self.question)) < 8 or len(normalized(self.answer)) < 8:
            raise ValueError('Question and answer must have at least 8 characters')
        return self


class Setup(Secret):
    current_password: str = Field(min_length=1, max_length=200)


class Reset(Secret):
    email: EmailStr
    new_password: str | None = Field(default=None, min_length=12, max_length=200)
    full_name: str | None = Field(default=None, min_length=1, max_length=150)

    @model_validator(mode='after')
    def changes(self):
        if not self.new_password and not (self.full_name or '').strip():
            raise ValueError('Enter a new password or account name')
        if self.full_name is not None and not self.full_name.strip():
            raise ValueError('Account name cannot be blank')
        return self


@router.put('')
def setup(data: Setup, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).with_for_update().first()
    if not user or not user.is_active or user.role == 'admin' or not verify_password(data.current_password, user.password_hash):
        raise HTTPException(403, 'Unable to configure recovery. Check your current password. Admin recovery requires support.')
    row = db.get(AccountRecovery, user_id)
    if row is None:
        row = AccountRecovery(user_id=user_id)
        db.add(row)
    row.question, row.answer_hash = normalized(data.question), hash_password(normalized(data.answer))
    row.failures, row.locked_until = 0, None
    db.commit()
    return {'message': 'Recovery question saved'}


@router.post('/reset')
def reset(data: Reset, db: Session = Depends(get_db)):
    # Lock the account across verification and mutation, including failed attempts.
    user = db.query(User).filter(User.email == str(data.email)).with_for_update().first()
    row = db.get(AccountRecovery, user.user_id) if user else None
    error = 'Recovery details do not match or recovery is temporarily unavailable. Try again later or contact support.'
    now = datetime.utcnow()
    if not user or not user.is_active or user.role == 'admin' or not row:
        raise HTTPException(400, error)
    if row.locked_until and row.locked_until > now:
        raise HTTPException(400, error)
    if row.locked_until:
        row.failures, row.locked_until = 0, None
    answer_ok = verify_password(normalized(data.answer), row.answer_hash)
    if not answer_ok or normalized(data.question) != row.question:
        row.failures += 1
        if row.failures >= 5:
            row.locked_until = now + timedelta(minutes=30)
        db.commit()
        raise HTTPException(400, error)
    if data.new_password:
        user.password_hash = hash_password(data.new_password)
        row.sessions_revoked_at = now
    if data.full_name:
        user.full_name = data.full_name.strip()
    row.failures, row.locked_until = 0, None
    db.commit()
    return {'message': 'Account updated. Log in with your registered email and password.'}
