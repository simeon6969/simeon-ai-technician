from typing import Literal
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import or_, cast, String, func
from sqlalchemy.orm import Session, load_only, aliased
from backend.auth import require_admin
from backend.routes.admin import get_db
from backend.models import User, JobCard, SparePart, SaleItem, MaintenanceKnowledge, SparePartRequest, ItemRequest
from backend.models.commissions import CommissionAgreement

router = APIRouter(prefix='/admin', tags=['Administration'])
Collection = Literal['users', 'job-cards', 'spare-parts', 'sale-items', 'knowledge', 'item-requests', 'spare-part-requests']
CONFIG = {
 'users': (User, 'user_id', 'user_id', 'user_id full_name email phone role account_field is_active created_at'),
 'job-cards': (JobCard, 'job_card_id', 'technician_id', 'job_card_id account_name submitter_name technician_id equipment_id maintenance_type fault_description symptoms diagnosis actions_taken parts_used result successful status created_at'),
 'spare-parts': (SparePart, 'spare_part_id', 'submitted_by', 'spare_part_id submitted_by equipment_id part_number part_name price currency manufacturer description specifications compatibility availability_status posted_at created_at'),
 'sale-items': (SaleItem, 'item_id', 'seller_id', 'item_id seller_id name description price currency posted_at created_at medical_category medical_details'),
 'knowledge': (MaintenanceKnowledge, 'knowledge_id', None, 'knowledge_id source_job_card_id equipment_id problem_description diagnosis solution parts_used successful confidence'),
 'item-requests': (ItemRequest, 'request_id', 'seller_id', 'request_id requester_id seller_id sale_item_id spare_part_id notes status created_at'),
 'spare-part-requests': (SparePartRequest, 'request_id', 'supplier_technician_id', 'request_id spare_part_id requester_id supplier_technician_id requester_contact notes status created_at'),
}
USER_FIELDS = 'user_id full_name email phone role account_field'.split()

def query_records(db, collection):
 model, pk, owner_key, fields = CONFIG[collection]
 owner = aliased(User)
 query = db.query(model, owner).options(load_only(*(getattr(model, key) for key in fields.split())), load_only(*(getattr(owner, key) for key in USER_FIELDS)))
 if collection == 'knowledge':
  query = query.outerjoin(JobCard, model.source_job_card_id == JobCard.job_card_id).outerjoin(owner, JobCard.technician_id == owner.user_id)
 else:
  query = query.outerjoin(owner, getattr(model, owner_key) == owner.user_id)
 return query, model, pk, owner, fields.split()

def serialize(row, owner, fields):
 return {**{key: getattr(row, key) for key in fields}, 'owner': {key: getattr(owner, key) for key in USER_FIELDS} if owner else None}

@router.get('/overview-counts')
def overview(admin=Depends(require_admin), db: Session = Depends(get_db)):
 counts = {key: db.query(func.count(getattr(model, pk))).scalar() for key, (model, pk, _, _) in CONFIG.items()}
 counts['awaiting_setup'] = db.query(func.count(User.user_id)).filter(User.role != 'admin', User.account_field.is_(None)).scalar()
 counts['fields'] = dict(db.query(User.account_field, func.count(User.user_id)).filter(User.account_field.isnot(None)).group_by(User.account_field).all())
 counts['roles'] = dict(db.query(User.role, func.count(User.user_id)).group_by(User.role).all())
 return counts

@router.get('/records/{collection}')
def records(collection: Collection, offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100),
 search: str = Query('', max_length=200), field: str = '', role: str = '', admin=Depends(require_admin), db: Session = Depends(get_db)):
 query, model, pk, owner, fields = query_records(db, collection)
 if field:
  query = query.filter(owner.account_field.is_(None) if field == 'unset' else owner.account_field == field)
 if role:
  query = query.filter(owner.role == role)
 if search.strip():
  term = search.strip().replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
  extra = []
  if collection in ('item-requests', 'spare-part-requests'):
   query = query.outerjoin(SparePart, model.spare_part_id == SparePart.spare_part_id)
   extra.append(SparePart.part_name.ilike('%'+term+'%', escape='\\'))
   if collection == 'item-requests':
    query = query.outerjoin(SaleItem, model.sale_item_id == SaleItem.item_id)
    extra.append(SaleItem.name.ilike('%'+term+'%', escape='\\'))
  query = query.filter(or_(*extra, *(cast(getattr(model, key), String).ilike('%'+term+'%', escape='\\') for key in fields), owner.full_name.ilike('%'+term+'%', escape='\\'), owner.email.ilike('%'+term+'%', escape='\\')))
 total = query.count()
 rows = query.order_by(getattr(model, pk).desc()).offset(offset).limit(limit).all()
 items = [serialize(row, user, fields) for row, user in rows]
 if collection in ('item-requests', 'spare-part-requests') and items:
  user_ids = {item['requester_id'] for item in items}
  users = {u.user_id: u for u in db.query(User).options(load_only(*(getattr(User, key) for key in USER_FIELDS))).filter(User.user_id.in_(user_ids)).all()}
  parts = dict(db.query(SparePart.spare_part_id, SparePart.part_name).filter(SparePart.spare_part_id.in_([item.get('spare_part_id') for item in items])).all())
  sales = dict(db.query(SaleItem.item_id, SaleItem.name).filter(SaleItem.item_id.in_([item.get('sale_item_id') for item in items])).all())
  commissions = dict(db.query(CommissionAgreement.request_id, CommissionAgreement.status).filter(CommissionAgreement.request_id.in_([item['request_id'] for item in items])).all()) if collection == 'item-requests' else {}
  for item in items:
   requester = users.get(item['requester_id'])
   item['requester_name'] = requester.full_name if requester else None
   item['requester_phone'] = requester.phone if requester else None
   item['item_name'] = sales.get(item.get('sale_item_id')) or parts.get(item.get('spare_part_id')) or 'Deleted item'
   if collection == 'item-requests': item['commission_status'] = commissions.get(item['request_id'], 'not_started')
 return {'items': items, 'total': total, 'offset': offset, 'limit': limit}

@router.get('/records/{collection}/{record_id}')
def details(collection: Collection, record_id: int, admin=Depends(require_admin), db: Session = Depends(get_db)):
 query, model, pk, owner, fields = query_records(db, collection)
 result = query.filter(getattr(model, pk) == record_id).first()
 if not result: raise HTTPException(404, 'Record not found')
 row, user = result
 data = serialize(row, user, fields)
 if hasattr(model, 'photo_data'): data['photo_data'] = row.photo_data
 return data
