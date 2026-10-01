from sqlalchemy import func
from backend.models import ItemRequest, SparePartRequest

def active_request_counts(db, user_id, kind):
    column = ItemRequest.sale_item_id if kind == 'sale' else ItemRequest.spare_part_id
    counts = dict(db.query(column, func.count(ItemRequest.request_id)).filter(
        ItemRequest.seller_id == user_id, column.isnot(None),
        ItemRequest.status.in_(['pending', 'accepted'])).group_by(column).all())
    if kind == 'spare_part':
        legacy = db.query(SparePartRequest.spare_part_id, func.count(SparePartRequest.request_id)).filter(
            SparePartRequest.supplier_technician_id == user_id,
            SparePartRequest.status.notin_(['completed', 'cancelled'])).group_by(SparePartRequest.spare_part_id).all()
        for key, count in legacy: counts[key] = counts.get(key, 0) + count
    return counts

def request_status(count):
    return {'request_status': 'requested' if count else 'non_requested', 'active_request_count': count}
