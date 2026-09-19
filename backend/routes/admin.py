from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, aliased
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError

from backend.auth import require_admin
from backend.database import SessionLocal
from backend.models.job_cards import JobCard
from backend.models.maintenance_knowledge import MaintenanceKnowledge
from backend.models.spare_part_requests import SparePartRequest
from backend.models.spare_parts import SparePart
from backend.models.users import User
from backend.models.sale_items import SaleItem
from backend.models.chat import ChatSession, ChatMessage
from backend.schemas.chat import AdminChatRequest
from backend.services.admin_chat_service import generate_admin_response


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def commit_deletion(db):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail='Related records changed. Refresh and try again.')


@router.delete('/users/{user_id}')
def delete_admin_user(user_id: int, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).with_for_update().first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    if user.role == 'admin':
        raise HTTPException(status_code=403, detail='Admin accounts cannot be deleted')
    try:
        cards = select(JobCard.job_card_id).where(JobCard.technician_id == user_id)
        parts = select(SparePart.spare_part_id).where(SparePart.submitted_by == user_id)
        sessions = select(ChatSession.session_id).where(ChatSession.user_id == user_id)
        db.query(MaintenanceKnowledge).filter(MaintenanceKnowledge.source_job_card_id.in_(cards)).delete(synchronize_session=False)
        db.query(JobCard).filter(JobCard.technician_id == user_id).delete(synchronize_session=False)
        db.query(SparePartRequest).filter(or_(
            SparePartRequest.requester_id == user_id,
            SparePartRequest.supplier_technician_id == user_id,
            SparePartRequest.spare_part_id.in_(parts),
        )).delete(synchronize_session=False)
        db.query(SparePart).filter(SparePart.submitted_by == user_id).delete(synchronize_session=False)
        db.query(SaleItem).filter(SaleItem.seller_id == user_id).delete(synchronize_session=False)
        db.query(ChatMessage).filter(ChatMessage.session_id.in_(sessions)).delete(synchronize_session=False)
        db.query(ChatSession).filter(ChatSession.user_id == user_id).delete(synchronize_session=False)
        db.delete(user)
        commit_deletion(db)
    except Exception:
        db.rollback()
        raise
    return {'user_id': user_id}


@router.delete('/job-cards/{job_card_id}')
def delete_admin_job_card(job_card_id: int, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    card = db.get(JobCard, job_card_id)
    if not card:
        raise HTTPException(status_code=404, detail='Job card not found')
    db.query(MaintenanceKnowledge).filter(MaintenanceKnowledge.source_job_card_id == job_card_id).delete(synchronize_session=False)
    db.delete(card)
    commit_deletion(db)
    return {'job_card_id': job_card_id}


@router.delete('/spare-parts/{spare_part_id}')
def delete_admin_spare_part(spare_part_id: int, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    part = db.get(SparePart, spare_part_id)
    if not part:
        raise HTTPException(status_code=404, detail='Spare part not found')
    db.query(SparePartRequest).filter(SparePartRequest.spare_part_id == spare_part_id).delete(synchronize_session=False)
    db.delete(part)
    commit_deletion(db)
    return {'spare_part_id': spare_part_id}


@router.get('/sale-items')
def get_admin_sale_items(admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    items = db.query(SaleItem, User.full_name).join(User, SaleItem.seller_id == User.user_id).order_by(SaleItem.created_at.desc()).all()
    return [{
        'item_id': item.item_id, 'seller_id': item.seller_id, 'seller_name': name,
        'name': item.name, 'description': item.description, 'price': str(item.price),
        'currency': item.currency, 'photo_data': item.photo_data,
        'posted_at': item.posted_at, 'created_at': item.created_at,
    } for item, name in items]


@router.delete('/sale-items/{item_id}')
def delete_admin_sale_item(item_id: int, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    item = db.get(SaleItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail='Sale item not found')
    db.delete(item)
    commit_deletion(db)
    return {'item_id': item_id}


@router.post('/chat')
def admin_chat(
    request: AdminChatRequest,
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not request.message.strip():
        raise HTTPException(status_code=422, detail='A question is required')
    try:
        return generate_admin_response(
            db, request.message, [turn.model_dump() for turn in request.history],
            request.language,
        )
    except Exception:
        # Do not expose database errors, query details or service credentials.
        raise HTTPException(status_code=503, detail='Admin chat is unavailable. Please try again.')


@router.get("/job-cards")
def get_all_job_cards(
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db)
):
    job_cards = (
        db.query(JobCard)
        .order_by(JobCard.created_at.desc())
        .all()
    )

    return [
        {
            "job_card_id": card.job_card_id,
            "account_name": card.account_name,
            "submitter_name": card.submitter_name,
            "technician_id": card.technician_id,
            "equipment_id": card.equipment_id,
            "maintenance_type": card.maintenance_type,
            "fault_description": card.fault_description,
            "symptoms": card.symptoms,
            "diagnosis": card.diagnosis,
            "actions_taken": card.actions_taken,
            "parts_used": card.parts_used,
            "result": card.result,
            "photo_data": card.photo_data,
            "attachments_data": card.attachments_data,
            "successful": card.successful,
            "status": card.status,
            "created_at": card.created_at
        }
        for card in job_cards
    ]


@router.get("/users")
def get_all_users(
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.created_at.desc()).all()

    return [
        {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
        for user in users
    ]


@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.user_id == admin_id and not is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own admin account"
        )

    user.is_active = is_active
    db.commit()
    db.refresh(user)

    return {
        "user_id": user.user_id,
        "is_active": user.is_active,
    }


@router.get("/knowledge")
def get_maintenance_knowledge(
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db)
):
    knowledge_records = (
        db.query(MaintenanceKnowledge)
        .order_by(MaintenanceKnowledge.created_at.desc())
        .all()
    )

    return [
        {
            "knowledge_id": item.knowledge_id,
            "source_job_card_id": item.source_job_card_id,
            "equipment_id": item.equipment_id,
            "problem_description": item.problem_description,
            "diagnosis": item.diagnosis,
            "solution": item.solution,
            "parts_used": item.parts_used,
            "successful": item.successful,
            "confidence": float(item.confidence)
        }
        for item in knowledge_records
    ]


@router.get("/spare-parts")
def get_all_spare_parts(
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db)
):
    parts = db.query(SparePart).order_by(SparePart.created_at.desc()).all()

    return [
        {
            "spare_part_id": part.spare_part_id,
            "submitted_by": part.submitted_by,
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
            "created_at": part.created_at,
        }
        for part in parts
    ]


@router.get("/spare-part-requests")
def get_spare_part_requests(
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db)
):
    requester_user = aliased(User)
    supplier_user = aliased(User)

    requests = (
        db.query(SparePartRequest, SparePart, requester_user, supplier_user)
        .join(
            SparePart,
            SparePartRequest.spare_part_id == SparePart.spare_part_id
        )
        .join(
            requester_user,
            SparePartRequest.requester_id == requester_user.user_id
        )
        .join(
            supplier_user,
            SparePartRequest.supplier_technician_id == supplier_user.user_id
        )
        .order_by(SparePartRequest.created_at.desc())
        .all()
    )

    return [
        {
            "request_id": request.request_id,
            "spare_part_id": request.spare_part_id,
            "spare_part": {
                "part_name": part.part_name,
            "price": str(part.price) if part.price is not None else None,
            "currency": part.currency,
                "part_number": part.part_number,
                "manufacturer": part.manufacturer,
                "description": part.description,
                "specifications": part.specifications,
                "compatibility": part.compatibility,
                "availability_status": part.availability_status,
                "photo_data": part.photo_data,
                "equipment_id": part.equipment_id,
            },
            "requester": {
                "user_id": requester.user_id,
                "full_name": requester.full_name,
                "email": requester.email,
                "phone": requester.phone,
            },
            "supplier_technician": {
                "user_id": supplier.user_id,
                "full_name": supplier.full_name,
                "email": supplier.email,
                "phone": supplier.phone,
            },
            "requester_contact": request.requester_contact,
            "status": request.status,
            "notes": request.notes,
            "created_at": request.created_at
        }
        for request, part, requester, supplier in requests
    ]


@router.put("/spare-part-requests/{request_id}")
def update_spare_part_request(
    request_id: int,
    status: str,
    notes: str | None = None,
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db)
):
    request = (
        db.query(SparePartRequest)
        .filter(
            SparePartRequest.request_id == request_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Spare part request not found"
        )

    allowed_statuses = {
        "new",
        "contacted",
        "negotiating",
        "confirmed",
        "ordered",
        "delivered",
        "completed",
        "cancelled"
    }

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid request status"
        )

    request.status = status

    if notes is not None:
        request.notes = notes

    db.commit()
    db.refresh(request)

    return {
        "message": "Spare part request updated successfully",
        "request_id": request.request_id,
        "status": request.status
    }
