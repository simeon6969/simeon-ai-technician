import base64
import binascii
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.orm import Session
from backend.auth import get_current_user_id
from backend.routes.spare_parts import get_db
from backend.models.branding import AccountBranding

router = APIRouter(prefix='/users/me/branding', tags=['Account image'])

class BrandingInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    image_data: str = Field(max_length=7000000)

@router.get('')
def branding(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    row = db.get(AccountBranding, user_id)
    return {'image_data': row.image_data if row else None}

@router.put('')
def save_branding(data: BrandingInput, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        prefix, encoded = data.image_data.split(',', 1)
        if prefix not in {'data:image/jpeg;base64', 'data:image/png;base64', 'data:image/webp;base64'}:
            raise ValueError()
        raw = base64.b64decode(encoded, validate=True)
        if len(raw) > 5 * 1024 * 1024:
            raise ValueError()
        with Image.open(BytesIO(raw)) as source:
            if source.width * source.height > 40000000:
                raise ValueError()
            source.draft('RGB', (512, 512))
            image = ImageOps.exif_transpose(source)
            image.thumbnail((512, 512))
            output = BytesIO()
            image.convert('RGBA').save(output, 'PNG')
        normalized = 'data:image/png;base64,' + base64.b64encode(output.getvalue()).decode()
    except (ValueError, OSError, binascii.Error, UnidentifiedImageError, Image.DecompressionBombError):
        raise HTTPException(422, 'Choose a valid JPEG, PNG, or WebP image up to 5 MB.') from None
    row = db.get(AccountBranding, user_id)
    if row is None:
        row = AccountBranding(user_id=user_id, image_data=normalized)
        db.add(row)
    else:
        row.image_data = normalized
    db.commit()
    return {'image_data': normalized}

@router.delete('')
def remove_branding(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    row = db.get(AccountBranding, user_id)
    if row:
        db.delete(row)
        db.commit()
    return {'image_data': None}
