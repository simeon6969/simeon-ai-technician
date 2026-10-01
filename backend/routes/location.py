from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session
from backend.auth import get_current_user_id
from backend.routes.spare_parts import get_db
from backend.models.location import AccountLocation

router = APIRouter(prefix='/users/me/location', tags=['Account location'])

class LocationInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    location: str = Field(max_length=500)

@router.get('')
def get_location(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    row = db.get(AccountLocation, user_id)
    return {'location': row.location if row else ''}

@router.put('')
def save_location(data: LocationInput, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    row = db.get(AccountLocation, user_id)
    if row is None:
        row = AccountLocation(user_id=user_id)
        db.add(row)
    row.location = data.location
    db.commit()
    return {'location': row.location}
