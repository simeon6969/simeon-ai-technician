from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user_id
from backend.database import SessionLocal
from backend.models.job_cards import JobCard
from backend.models.maintenance_knowledge import MaintenanceKnowledge
from backend.schemas.job_cards import JobCardCreate


router = APIRouter(
    prefix="/job-cards",
    tags=["Job Cards"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_job_card(
    job_card_data: JobCardCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    new_job_card = JobCard(
        technician_id=user_id,
        equipment_id=job_card_data.equipment_id,
        maintenance_type=job_card_data.maintenance_type,
        fault_description=job_card_data.fault_description,
        symptoms=job_card_data.symptoms,
        diagnosis=job_card_data.diagnosis,
        actions_taken=job_card_data.actions_taken,
        parts_used=job_card_data.parts_used,
        result=job_card_data.result,
        photo_data=job_card_data.photo_data,
        attachments_data=job_card_data.attachments_data,
        successful=job_card_data.successful
    )

    db.add(new_job_card)
    db.commit()
    db.refresh(new_job_card)

    return {
        "message": "Job card created successfully",
        "job_card_id": new_job_card.job_card_id,
        "technician_id": new_job_card.technician_id,
        "equipment_id": new_job_card.equipment_id,
        "maintenance_type": new_job_card.maintenance_type,
        "successful": new_job_card.successful,
        "status": new_job_card.status
    }


@router.get("/")
def get_my_job_cards(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    job_cards = (
        db.query(JobCard)
        .filter(JobCard.technician_id == user_id)
        .order_by(JobCard.created_at.desc())
        .all()
    )

    return [
        {
            "job_card_id": card.job_card_id,
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


@router.get("/{job_card_id}")
def get_job_card(
    job_card_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    job_card = (
        db.query(JobCard)
        .filter(
            JobCard.job_card_id == job_card_id,
            JobCard.technician_id == user_id
        )
        .first()
    )

    if not job_card:
        raise HTTPException(
            status_code=404,
            detail="Job card not found"
        )

    return {
        "job_card_id": job_card.job_card_id,
        "technician_id": job_card.technician_id,
        "equipment_id": job_card.equipment_id,
        "maintenance_type": job_card.maintenance_type,
        "fault_description": job_card.fault_description,
        "symptoms": job_card.symptoms,
        "diagnosis": job_card.diagnosis,
        "actions_taken": job_card.actions_taken,
        "parts_used": job_card.parts_used,
        "result": job_card.result,
        "photo_data": job_card.photo_data,
        "attachments_data": job_card.attachments_data,
        "successful": job_card.successful,
        "status": job_card.status,
        "confirmed_at": job_card.confirmed_at,
        "created_at": job_card.created_at,
        "updated_at": job_card.updated_at
    }


@router.put("/{job_card_id}")
def update_job_card(
    job_card_id: int,
    job_card_data: JobCardCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    job_card = (
        db.query(JobCard)
        .filter(
            JobCard.job_card_id == job_card_id,
            JobCard.technician_id == user_id
        )
        .first()
    )

    if not job_card:
        raise HTTPException(
            status_code=404,
            detail="Job card not found"
        )

    if job_card.status == "validated":
        raise HTTPException(
            status_code=400,
            detail="Validated job cards cannot be edited"
        )

    job_card.equipment_id = job_card_data.equipment_id
    job_card.maintenance_type = job_card_data.maintenance_type
    job_card.fault_description = job_card_data.fault_description
    job_card.symptoms = job_card_data.symptoms
    job_card.diagnosis = job_card_data.diagnosis
    job_card.actions_taken = job_card_data.actions_taken
    job_card.parts_used = job_card_data.parts_used
    job_card.result = job_card_data.result
    job_card.photo_data = job_card_data.photo_data
    job_card.attachments_data = job_card_data.attachments_data
    job_card.successful = job_card_data.successful
    job_card.updated_at = datetime.now()

    db.commit()
    db.refresh(job_card)

    return {
        "message": "Job card updated successfully",
        "job_card_id": job_card.job_card_id,
        "status": job_card.status
    }


@router.delete("/{job_card_id}")
def delete_job_card(
    job_card_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    job_card = (
        db.query(JobCard)
        .filter(
            JobCard.job_card_id == job_card_id,
            JobCard.technician_id == user_id
        )
        .first()
    )

    if not job_card:
        raise HTTPException(status_code=404, detail="Job card not found")

    db.query(MaintenanceKnowledge).filter(
        MaintenanceKnowledge.source_job_card_id == job_card.job_card_id
    ).delete(synchronize_session=False)

    db.delete(job_card)
    db.commit()

    return {
        "message": "Job card deleted successfully",
        "job_card_id": job_card_id
    }


@router.post("/{job_card_id}/validate")
def validate_job_card(
    job_card_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    job_card = (
        db.query(JobCard)
        .filter(
            JobCard.job_card_id == job_card_id,
            JobCard.technician_id == user_id
        )
        .first()
    )

    if not job_card:
        raise HTTPException(
            status_code=404,
            detail="Job card not found"
        )

    if job_card.successful is not True:
        raise HTTPException(
            status_code=400,
            detail="Job card must be marked successful before validation"
        )

    if job_card.status == "validated":
        raise HTTPException(
            status_code=400,
            detail="Job card is already validated"
        )

    job_card.status = "validated"
    job_card.confirmed_at = datetime.now()
    job_card.updated_at = datetime.now()

    knowledge = MaintenanceKnowledge(
        source_job_card_id=job_card.job_card_id,
        equipment_id=job_card.equipment_id,
        problem_description=job_card.fault_description,
        symptoms=job_card.symptoms,
        diagnosis=job_card.diagnosis,
        solution=job_card.actions_taken,
        parts_used=job_card.parts_used,
        successful=True,
        confidence=1.000
    )

    db.add(knowledge)
    db.commit()
    db.refresh(job_card)
    db.refresh(knowledge)

    return {
        "message": "Job card validated and added to maintenance knowledge",
        "job_card_id": job_card.job_card_id,
        "knowledge_id": knowledge.knowledge_id,
        "status": job_card.status,
        "confidence": float(knowledge.confidence)
    }