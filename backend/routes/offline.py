import hashlib
from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.auth import get_current_user_id
from backend.routes.spare_parts import get_db
from backend.models.users import User
from backend.models.equipment import Equipment
from backend.models.job_cards import JobCard
from backend.models.spare_parts import SparePart
from backend.models.maintenance_knowledge import MaintenanceKnowledge
from backend.models.offline_submission import OfflineSubmission
from backend.schemas.job_cards import JobCardCreate
from backend.schemas.spare_parts import SparePartCreate

router = APIRouter(prefix='/offline', tags=['Offline sync'])


class EquipmentInput(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    manufacturer: str = Field(min_length=1, max_length=150)
    model: str = Field(min_length=1, max_length=150)
    description: str | None = None


class JobInput(BaseModel):
    kind: Literal['job']
    submission_id: UUID
    equipment: EquipmentInput
    job: JobCardCreate


class PartInput(BaseModel):
    kind: Literal['part']
    submission_id: UUID
    part: SparePartCreate


@router.post('/submit')
def submit(data: Annotated[JobInput | PartInput, Field(discriminator='kind')],
           user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    key = (user_id, str(data.submission_id))
    fingerprint = hashlib.sha256(data.model_dump_json().encode()).hexdigest()

    def receipt_result(receipt):
        if receipt.fingerprint != fingerprint:
            raise HTTPException(409, 'This submission ID has already been used for different answers')
        return {'kind': receipt.kind, 'record_id': receipt.record_id}

    previous = db.get(OfflineSubmission, key)
    if previous:
        return receipt_result(previous)
    try:
        account = db.get(User, user_id)
        if not account or not account.is_active:
            raise HTTPException(401, 'Please log in again')
        if data.kind == 'job':
            submitter = account.full_name if account.role == 'technician' else (data.job.submitter_name or '').strip()
            if not submitter:
                raise HTTPException(422, 'Submitter name is required for shared accounts')
            equipment = Equipment(**data.equipment.model_dump())
            db.add(equipment)
            db.flush()
            card = JobCard(**data.job.model_dump(exclude={'equipment_id', 'submitter_name'}),
                           equipment_id=equipment.equipment_id, technician_id=user_id,
                           account_name=account.full_name, submitter_name=submitter)
            db.add(card)
            db.flush()
            record_id = card.job_card_id
            if card.successful:
                card.status = 'validated'
                card.confirmed_at = datetime.now()
                db.add(MaintenanceKnowledge(source_job_card_id=record_id, equipment_id=card.equipment_id,
                    problem_description=card.fault_description, symptoms=card.symptoms, diagnosis=card.diagnosis,
                    solution=card.actions_taken, parts_used=card.parts_used, successful=True, confidence=1.000))
        else:
            part = SparePart(submitted_by=user_id, **data.part.model_dump())
            db.add(part)
            db.flush()
            record_id = part.spare_part_id
        receipt = OfflineSubmission(user_id=user_id, submission_id=key[1], fingerprint=fingerprint,
                                    kind=data.kind, record_id=record_id)
        db.add(receipt)
        db.commit()
        return receipt_result(receipt)
    except IntegrityError:
        # A concurrent retry may have committed the same submission. Roll back ALL
        # newly created rows before returning its receipt.
        db.rollback()
        previous = db.get(OfflineSubmission, key)
        if previous:
            return receipt_result(previous)
        raise HTTPException(409, 'Unable to save this record. Check its related records and retry.')
    except Exception:
        db.rollback()
        raise
