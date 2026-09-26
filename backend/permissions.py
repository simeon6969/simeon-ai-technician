from fastapi import Depends, HTTPException
from backend.auth import get_current_user_id
from backend.database import SessionLocal
from backend.models.users import User
from sqlalchemy.orm import Session

LEGACY_ROLES = {'organization', 'institution', 'health_facility', 'other_business'}


def check_role(account, allowed):
    if not account or not account.is_active:
        raise HTTPException(401, 'Please sign in again')
    # Preserve existing access until legacy accounts complete their one-time setup.
    role = 'technician' if account.role in LEGACY_ROLES and account.account_field is None else account.role
    if role not in allowed and role != 'admin':
        raise HTTPException(403, 'This function is not available for your account role')


def permission_db():
    with SessionLocal() as db:
        yield db


def allow_roles(*allowed):
    def dependency(user_id: int = Depends(get_current_user_id), db: Session = Depends(permission_db)):
        check_role(db.get(User, user_id), allowed)
        return user_id
    return dependency


require_technician = allow_roles('technician')
require_inventory = allow_roles('technician', 'store')
