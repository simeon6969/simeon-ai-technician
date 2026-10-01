import re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.auth import get_current_user_id
from backend.routes.spare_parts import get_db
from backend.routes.commissions import admin_only
from backend.job_forms import current_form, CORE
from backend.models.job_forms import JobFormVersion, JobSheetSettings, JobSheetSubmission
from backend.sheet_sync import DEFAULT_SPREADSHEET, credentials_status

router = APIRouter(tags=['Job-card questions and spreadsheet'])

class Question(BaseModel):
    key: str = Field(pattern=r'^[a-z][a-z0-9_]{0,79}$')
    label: str = Field(min_length=1, max_length=200)
    help: str = Field(default='', max_length=1000)
    required: bool = False
    kind: str = 'text'

class FormInput(BaseModel):
    version: int = Field(ge=0)
    questions: list[Question] = Field(min_length=1, max_length=50)

class SheetInput(BaseModel):
    enabled: bool
    spreadsheet_url: str = Field(max_length=500)

@router.get('/job-card-form')
def get_form(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return current_form(db)

@router.put('/admin/job-card-form')
def save_form(data: FormInput, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    admin_only(db, user_id)
    current = current_form(db)
    if data.version != current['version']:
        raise HTTPException(409, 'Questions changed. Refresh before saving.')
    keys = [q.key for q in data.questions]
    if len(set(keys)) != len(keys) or not set(CORE).issubset(keys):
        raise HTTPException(422, 'Keep all standard questions and use unique custom question keys')
    for q in data.questions:
        if not q.label.strip() or (q.key in CORE and (q.kind != CORE[q.key][4] or CORE[q.key][3] and not q.required)):
            raise HTTPException(422, 'Required standard questions and their types must be preserved')
        if q.key not in CORE and (not q.key.startswith('custom_') or q.kind != 'text'):
            raise HTTPException(422, 'Additional questions must use custom_ keys and text answers')
    row = JobFormVersion(version=current['version'] + 1, questions=[[q.key, q.label.strip(), q.help.strip(), q.required, q.kind] for q in data.questions])
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Questions changed. Refresh before saving.') from None
    return current_form(db)

@router.get('/admin/job-card-sheet')
def sheet_status(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    admin_only(db, user_id)
    row = db.get(JobSheetSettings, 1)
    pending = db.query(JobSheetSubmission).filter_by(synced=False)
    return {'enabled': row.enabled if row else True, 'spreadsheet_url': 'https://docs.google.com/spreadsheets/d/' + (row.spreadsheet_id if row else DEFAULT_SPREADSHEET) + '/edit',
        **credentials_status(), 'pending': pending.count(), 'synced': db.query(JobSheetSubmission).filter_by(synced=True).count(),
        'errors': [{'job_card_id': item.job_card_id, 'error': item.error} for item in pending.filter(JobSheetSubmission.error.is_not(None)).limit(10)]}

@router.put('/admin/job-card-sheet')
def save_sheet(data: SheetInput, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    admin_only(db, user_id)
    match = re.fullmatch(r'https://docs\.google\.com/spreadsheets/d/([A-Za-z0-9_-]{10,150})(?:/[^?#]*)?(?:[?#].*)?', data.spreadsheet_url.strip())
    if not match:
        raise HTTPException(422, 'Enter a Google Sheets spreadsheet link')
    row = db.get(JobSheetSettings, 1)
    if row is None:
        row = JobSheetSettings(id=1, spreadsheet_id=match[1], enabled=data.enabled)
        db.add(row)
    else:
        if row.spreadsheet_id != match[1]:
            db.query(JobSheetSubmission).update({'synced': False, 'retry_at': None, 'error': None})
        row.spreadsheet_id, row.enabled = match[1], data.enabled
    db.commit()
    return sheet_status(user_id, db)

@router.post('/admin/job-card-sheet/retry')
def retry_sheet(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    admin_only(db, user_id)
    db.query(JobSheetSubmission).filter_by(synced=False).update({'retry_at': None, 'error': None})
    db.commit()
    return sheet_status(user_id, db)


@router.post('/admin/job-card-sheet/include-existing')
def include_existing(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    from types import SimpleNamespace
    from backend.models.job_cards import JobCard
    from backend.job_forms import record_submission
    admin_only(db, user_id)
    cards = db.query(JobCard).outerjoin(JobSheetSubmission, JobSheetSubmission.job_card_id == JobCard.job_card_id).filter(JobSheetSubmission.job_card_id.is_(None)).limit(500).all()
    for card in cards:
        record_submission(db, card, SimpleNamespace(form_version=0, custom_answers={}))
    db.commit()
    return sheet_status(user_id, db)
