from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.auth import get_current_user_id
from backend.database import SessionLocal
from backend.models.equipment import Equipment


router = APIRouter(
    prefix="/equipment",
    tags=["Equipment"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_equipment(
    category: str,
    manufacturer: str,
    model: str,
    description: str | None = None,
    technical_specs: str | None = None,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    new_equipment = Equipment(
        category=category,
        manufacturer=manufacturer,
        model=model,
        description=description,
        technical_specs=technical_specs
    )

    db.add(new_equipment)
    db.commit()
    db.refresh(new_equipment)

    return {
        "message": "Equipment created successfully",
        "equipment_id": new_equipment.equipment_id,
        "category": new_equipment.category,
        "manufacturer": new_equipment.manufacturer,
        "model": new_equipment.model
    }