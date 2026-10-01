from fastapi import HTTPException
from backend.models.job_forms import JobFormVersion, JobSheetSubmission
from backend.models.equipment import Equipment

DEFAULT_QUESTIONS = [
    ['equipment', 'Equipment', 'Example: Humacount 30TS', True, 'text'],
    ['manufacturer', 'Manufacturer', 'Example: HUMAN', True, 'text'],
    ['model', 'Model', 'Equipment model', True, 'text'],
    ['problem_description', 'Problem Description', 'Describe the reported problem', True, 'text'],
    ['symptoms', 'Symptoms / Error', 'What symptoms or error messages were observed?', False, 'text'],
    ['diagnosis', 'Diagnosis', 'What was found to be causing the problem?', False, 'text'],
    ['solution', 'Solution / Repair Performed', 'Describe the repair or maintenance performed', False, 'text'],
    ['parts_used', 'Parts Used', 'Example: Sample probe tubing', False, 'text'],
    ['photo_data', 'Job card photo (optional)', '', False, 'photo'],
    ['successful', 'Maintenance successful', 'I confirm the maintenance was completed successfully. This will validate the job card and add it to S\'s trusted technical knowledge.', True, 'boolean'],
]
CORE = {row[0]: row for row in DEFAULT_QUESTIONS}

def current_form(db):
    row = db.query(JobFormVersion).order_by(JobFormVersion.version.desc()).first()
    return {'version': row.version, 'questions': row.questions} if row else {'version': 0, 'questions': DEFAULT_QUESTIONS}

def form_for_version(db, version):
    if version == 0:
        return DEFAULT_QUESTIONS
    row = db.get(JobFormVersion, version)
    if not row:
        raise HTTPException(422, 'Unknown job-card question version')
    return row.questions

def record_submission(db, card, payload):
    questions = form_for_version(db, payload.form_version)
    equipment = db.get(Equipment, card.equipment_id)
    answers = {'equipment': equipment.category if equipment else '', 'manufacturer': equipment.manufacturer if equipment else '',
        'model': equipment.model if equipment else '', 'problem_description': card.fault_description,
        'symptoms': card.symptoms, 'diagnosis': card.diagnosis, 'solution': card.actions_taken,
        'parts_used': card.parts_used, 'successful': card.successful, 'photo_data': 'Photo attached' if card.photo_data else ''}
    known = {q[0] for q in questions}
    if any(key not in known or key in CORE for key in payload.custom_answers):
        raise HTTPException(422, 'Unknown custom question')
    answers.update(payload.custom_answers)
    for key, label, help_text, required, kind in questions:
        value = answers.get(key)
        if required and payload.form_version > 0 and (value is None or isinstance(value, str) and not value.strip()):
            raise HTTPException(422, 'Please answer all required job-card questions')
        if key not in CORE and value is not None and not isinstance(value, str):
            raise HTTPException(422, 'Custom answers must be text')
    row = db.get(JobSheetSubmission, card.job_card_id)
    if row is None:
        row = JobSheetSubmission(job_card_id=card.job_card_id, form_version=payload.form_version, questions=questions, answers=answers)
        db.add(row)
    else:
        row.answers = {**row.answers, **{key: value for key, value in answers.items() if key in CORE}}
        row.synced = False
        row.retry_at = None
    return row


def refresh_submission(db, card):
    row = db.query(JobSheetSubmission).filter_by(job_card_id=card.job_card_id).with_for_update().populate_existing().first()
    if row:
        equipment = db.get(Equipment, card.equipment_id)
        row.answers = {**row.answers, 'equipment': equipment.category if equipment else '',
            'manufacturer': equipment.manufacturer if equipment else '', 'model': equipment.model if equipment else '',
            'problem_description': card.fault_description, 'symptoms': card.symptoms,
            'diagnosis': card.diagnosis, 'solution': card.actions_taken, 'parts_used': card.parts_used,
            'successful': card.successful, 'photo_data': 'Photo attached' if card.photo_data else ''}
        row.synced = False
        row.retry_at = None
