from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.models.commissions import CommissionAgreement, PaymentReviewNotification


def backfill_payment_reviews(engine):
    # Preserve submissions made before the notification queue was introduced.
    with Session(engine) as db:
        rows = db.query(CommissionAgreement).filter_by(status='pending_review').all()
        for agreement in rows:
            if db.query(PaymentReviewNotification).filter_by(request_id=agreement.request_id, revision=agreement.revision).first():
                continue
            submitted = next((entry['at'] for entry in reversed(agreement.history or []) if entry.get('action') in {'payment', 'accept'}), None)
            when = datetime.fromisoformat(submitted).astimezone(timezone.utc).replace(tzinfo=None) if submitted else datetime.now(timezone.utc).replace(tzinfo=None)
            db.add(PaymentReviewNotification(request_id=agreement.request_id, revision=agreement.revision, created_at=when))
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
