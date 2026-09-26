from backend.routes.subscriptions import selected_subscription
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.auth import create_access_token
from backend.database import SessionLocal
from backend.models.users import User
from backend.schemas.auth import LoginRequest
from backend.schemas.users import UserCreate, AccountSetup
from backend.security import hash_password, verify_password

from backend.auth import create_access_token, get_current_user_id

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    subscription = selected_subscription(user_data.subscription, db)
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        account_field=user_data.account_field,
    )

    db.add(new_user)
    try:
        db.flush()
        if subscription is not None:
            subscription.user_id = new_user.user_id
            db.add(subscription)
        db.commit()
    except IntegrityError as error:
        db.rollback()
        code = getattr(error.orig, 'sqlstate', None)
        if code == '23505':
            raise HTTPException(status_code=409, detail='Email already registered') from error
        raise HTTPException(status_code=503, detail='Account creation is temporarily unavailable. Please contact support.') from error
    db.refresh(new_user)

    return {
        "message": "Account registered successfully",
        "user_id": new_user.user_id,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "phone": new_user.phone,
        "role": new_user.role,
        "account_field": new_user.account_field,
    }



@router.post("/login")
def login_user(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == login_data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        login_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    from backend.subscription_access import check_subscription
    check_subscription(user, db)
    access_token = create_access_token(user.user_id)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "full_name": user.full_name,
        "role": user.role,
        "account_field": user.account_field,
    }

@router.get("/me")
def get_my_profile(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "account_field": user.account_field,
    }


@router.put('/account-setup')
def setup_account(data: AccountSetup, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).with_for_update().first()
    if not user or user.role == 'admin':
        raise HTTPException(403, 'Admin accounts are managed separately')
    if user.account_field is not None:
        raise HTTPException(409, 'Account setup is already complete')
    user.account_field = data.account_field
    user.role = data.role
    db.commit()
    return get_my_profile(user_id=user_id, db=db)
