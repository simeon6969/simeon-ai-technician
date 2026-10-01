from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator, ConfigDict
from sqlalchemy.orm import Session
from backend.auth import require_admin
from backend.routes.admin import get_db
from backend.models.app_branding import AppBranding
from backend.routes.branding import normalize_image

router = APIRouter(tags=['App branding'])

class BrandingSettings(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str = Field(min_length=1, max_length=60)
    logo: str | None = Field(default=None, max_length=7000000)

    @field_validator('name')
    @classmethod
    def clean_name(cls, value):
        value = value.strip()
        if not value or any(ord(char) < 32 for char in value):
            raise ValueError('Enter a display name without control characters.')
        return value

@router.get('/app-branding', response_model=BrandingSettings)
def get_branding(db: Session = Depends(get_db)):
    row = db.get(AppBranding, 1)
    return BrandingSettings(name=row.name, logo=row.logo) if row else BrandingSettings(name='S')

@router.put('/admin/app-branding', response_model=BrandingSettings)
def save_branding(data: BrandingSettings, admin=Depends(require_admin), db: Session = Depends(get_db)):
    logo = normalize_image(data.logo) if data.logo else None
    row = db.get(AppBranding, 1)
    if row is None:
        row = AppBranding(id=1)
        db.add(row)
    row.name, row.logo = data.name, logo
    db.commit()
    return BrandingSettings(name=row.name, logo=row.logo)
