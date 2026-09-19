import json

from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.auth import get_current_user_id
from backend.database import SessionLocal
from backend.models.spare_parts import SparePart
from backend.models.spare_part_requests import SparePartRequest
from backend.models.users import User
from backend.schemas.spare_parts import SparePartCreate


router = APIRouter(
    prefix="/spare-parts",
    tags=["Spare Parts"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_spare_part(
    spare_part_data: SparePartCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    new_part = SparePart(
        submitted_by=user_id,
        equipment_id=spare_part_data.equipment_id,
        part_number=spare_part_data.part_number,
        part_name=spare_part_data.part_name,
        price=spare_part_data.price,
        currency=spare_part_data.currency,
        manufacturer=spare_part_data.manufacturer,
        description=spare_part_data.description,
        specifications=spare_part_data.specifications,
        compatibility=spare_part_data.compatibility,
        photo_data=spare_part_data.photo_data,
        attachments_data=spare_part_data.attachments_data,
        availability_status=spare_part_data.availability_status
    )

    db.add(new_part)
    db.commit()
    db.refresh(new_part)

    return {
        "message": "Spare part stored successfully",
        "spare_part_id": new_part.spare_part_id,
        "part_name": new_part.part_name,
        "price": str(new_part.price) if new_part.price is not None else None,
        "currency": new_part.currency,
        "part_number": new_part.part_number,
        "availability_status": new_part.availability_status,
        "notification_count": 0
    }


@router.get("/")
def search_spare_parts(
    search: str | None = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    query = db.query(SparePart)

    if search:
        search_term = f"%{search}%"

        query = query.filter(
            (SparePart.part_name.ilike(search_term))
            | (SparePart.part_number.ilike(search_term))
            | (SparePart.manufacturer.ilike(search_term))
            | (SparePart.compatibility.ilike(search_term))
        )

    parts = query.order_by(
        SparePart.created_at.desc()
    ).all()

    return [
        {
            "spare_part_id": part.spare_part_id,
            "equipment_id": part.equipment_id,
            "part_number": part.part_number,
            "part_name": part.part_name,
            "price": str(part.price) if part.price is not None else None,
            "currency": part.currency,
            "manufacturer": part.manufacturer,
            "description": part.description,
            "specifications": part.specifications,
            "compatibility": part.compatibility,
            "photo_data": part.photo_data,
            "attachments_data": part.attachments_data,
            "availability_status": part.availability_status
        }
        for part in parts
    ]


@router.get("/my")
def get_my_spare_parts(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    parts = (
        db.query(
            SparePart,
            func.count(SparePartRequest.request_id).label("notification_count")
        )
        .outerjoin(
            SparePartRequest,
            SparePartRequest.spare_part_id == SparePart.spare_part_id
        )
        .filter(SparePart.submitted_by == user_id)
        .group_by(SparePart.spare_part_id)
        .order_by(SparePart.created_at.desc())
        .all()
    )

    return [
        {
            "spare_part_id": part.spare_part_id,
            "equipment_id": part.equipment_id,
            "part_number": part.part_number,
            "part_name": part.part_name,
            "price": str(part.price) if part.price is not None else None,
            "currency": part.currency,
            "manufacturer": part.manufacturer,
            "description": part.description,
            "specifications": part.specifications,
            "compatibility": part.compatibility,
            "photo_data": part.photo_data,
            "attachments_data": part.attachments_data,
            "availability_status": part.availability_status,
            "notification_count": notification_count,
            "posted_at": part.posted_at,
            "created_at": part.created_at,
        }
        for part, notification_count in parts
    ]


@router.get('/posts')
def list_posts(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    query = db.query(SparePart, User.full_name).join(User, User.user_id == SparePart.submitted_by).filter(SparePart.posted_at.is_not(None))
    total = query.count()
    rows = query.order_by(SparePart.posted_at.desc(), SparePart.spare_part_id.desc()).offset(offset).limit(limit).all()
    return {'total': total, 'posts': [
        {'spare_part_id': part.spare_part_id, 'part_name': part.part_name,
         'price': str(part.price) if part.price is not None else None, 'currency': part.currency,
         'part_number': part.part_number, 'manufacturer': part.manufacturer,
         'description': part.description, 'specifications': part.specifications,
         'compatibility': part.compatibility, 'photo_data': part.photo_data,
         'availability_status': part.availability_status, 'posted_at': part.posted_at,
         'technician_name': name, 'technician_id': part.submitted_by}
        for part, name in rows
    ]}


@router.post('/{spare_part_id}/post')
def post_spare_part(
    spare_part_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    part = db.query(SparePart).filter(SparePart.spare_part_id == spare_part_id, SparePart.submitted_by == user_id).first()
    if not part:
        raise HTTPException(status_code=404, detail='Spare part not found')
    db.query(SparePart).filter(SparePart.spare_part_id == spare_part_id, SparePart.posted_at.is_(None)).update({'posted_at': datetime.utcnow()}, synchronize_session=False)
    db.commit()
    db.refresh(part)
    return {'spare_part_id': part.spare_part_id, 'posted_at': part.posted_at}


@router.get("/requests/my")
def get_my_spare_part_requests(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    requests = (
        db.query(SparePartRequest, SparePart)
        .join(
            SparePart,
            SparePartRequest.spare_part_id == SparePart.spare_part_id
        )
        .filter(SparePartRequest.requester_id == user_id)
        .order_by(SparePartRequest.created_at.desc())
        .all()
    )

    return [
        {
            "request_id": request.request_id,
            "spare_part_id": part.spare_part_id,
            "part_name": part.part_name,
            "price": str(part.price) if part.price is not None else None,
            "currency": part.currency,
            "part_number": part.part_number,
            "manufacturer": part.manufacturer,
            "description": part.description,
            "specifications": part.specifications,
            "compatibility": part.compatibility,
            "photo_data": part.photo_data,
            "attachments_data": part.attachments_data,
            "availability_status": part.availability_status,
            "status": request.status,
            "notes": request.notes,
            "created_at": request.created_at
        }
        for request, part in requests
    ]


@router.delete("/{spare_part_id}")
def delete_spare_part(
    spare_part_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    part = (
        db.query(SparePart)
        .filter(
            SparePart.spare_part_id == spare_part_id,
            SparePart.submitted_by == user_id
        )
        .first()
    )

    if not part:
        raise HTTPException(status_code=404, detail="Spare part not found")

    db.query(SparePartRequest).filter(
        SparePartRequest.spare_part_id == part.spare_part_id
    ).delete(synchronize_session=False)
    db.delete(part)
    db.commit()

    return {
        "message": "Spare part deleted successfully",
        "spare_part_id": spare_part_id
    }


@router.get("/{spare_part_id}")
def get_spare_part(
    spare_part_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    part = (
        db.query(SparePart)
        .filter(SparePart.spare_part_id == spare_part_id)
        .first()
    )

    if not part:
        raise HTTPException(
            status_code=404,
            detail="Spare part not found"
        )

    return {
        "spare_part_id": part.spare_part_id,
        "equipment_id": part.equipment_id,
        "part_number": part.part_number,
        "part_name": part.part_name,
            "price": str(part.price) if part.price is not None else None,
            "currency": part.currency,
        "manufacturer": part.manufacturer,
        "description": part.description,
        "specifications": part.specifications,
        "compatibility": part.compatibility,
        "photo_data": part.photo_data,
        "attachments_data": part.attachments_data,
        "availability_status": part.availability_status
    }


@router.post("/{spare_part_id}/request")
def request_spare_part(
    spare_part_id: int,
    requester_contact: str | None = None,
    notes: str | None = None,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    part = (
        db.query(SparePart)
        .filter(SparePart.spare_part_id == spare_part_id)
        .first()
    )

    if not part:
        raise HTTPException(
            status_code=404,
            detail="Spare part not found"
        )

    if part.availability_status == "unavailable":
        raise HTTPException(
            status_code=400,
            detail="This spare part is currently unavailable"
        )

    if part.submitted_by == user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot request your own spare part"
        )

    new_request = SparePartRequest(
        spare_part_id=part.spare_part_id,
        requester_id=user_id,
        supplier_technician_id=part.submitted_by,
        requester_contact=requester_contact,
        notes=notes
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {
        "message": "Spare part request submitted successfully",
        "request_id": new_request.request_id,
        "spare_part_id": new_request.spare_part_id,
        "part_name": part.part_name,
            "price": str(part.price) if part.price is not None else None,
            "currency": part.currency,
        "part_number": part.part_number,
        "manufacturer": part.manufacturer,
        "description": part.description,
        "specifications": part.specifications,
        "compatibility": part.compatibility,
        "photo_data": part.photo_data,
        "attachments_data": part.attachments_data,
        "availability_status": part.availability_status,
        "status": new_request.status
    }
