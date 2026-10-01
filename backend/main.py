
import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.base import Base
from backend.auth import require_admin
from backend.database import engine
from backend.account_migration import migrate_account_roles
import backend.models

from backend.routes.users import router as users_router
from backend.routes.equipment import router as equipment_router
from backend.routes.job_cards import router as job_cards_router
from backend.routes.spare_parts import router as spare_parts_router
from backend.routes.admin import router as admin_router
from backend.routes.chat import router as chat_router
from backend.routes.sale_items import router as sale_items_router
from backend.routes.offline import router as offline_router
from backend.routes.item_requests import router as item_requests_router
from backend.routes.admin_manage import router as admin_manage_router
from backend.routes.delivery import router as delivery_router


app = FastAPI(title="S API")


ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
).split(",")


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users_router)
app.include_router(equipment_router)
app.include_router(job_cards_router)
app.include_router(spare_parts_router)
app.include_router(admin_router)
app.include_router(chat_router)
app.include_router(sale_items_router)
app.include_router(offline_router)
app.include_router(item_requests_router)
app.include_router(admin_manage_router)


@app.on_event("startup")
def create_missing_tables():
    Base.metadata.create_all(bind=engine)
    from backend.payment_review_migration import backfill_payment_reviews
    backfill_payment_reviews(engine)
    if engine.dialect.name == "postgresql":
        with engine.begin() as connection:
            connection.exec_driver_sql("ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS medical_category VARCHAR(30)")
            connection.exec_driver_sql("ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS medical_details JSON")
            connection.exec_driver_sql("ALTER TABLE account_recovery ADD COLUMN IF NOT EXISTS sessions_revoked_at TIMESTAMP")
            connection.exec_driver_sql("ALTER TABLE account_subscriptions ADD COLUMN IF NOT EXISTS payment_required BOOLEAN NOT NULL DEFAULT FALSE")

    with engine.begin() as connection:
        migrate_account_roles(connection)
        connection.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS account_field VARCHAR(20)")
        connection.exec_driver_sql("ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS price NUMERIC(14,2)")
        connection.exec_driver_sql("ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'RWF'")
        connection.exec_driver_sql("ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS account_name VARCHAR(150)")
        connection.exec_driver_sql("ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS submitter_name VARCHAR(150)")
        connection.exec_driver_sql("UPDATE job_cards SET account_name = users.full_name FROM users WHERE job_cards.technician_id = users.user_id AND job_cards.account_name IS NULL")
        connection.exec_driver_sql("UPDATE job_cards SET submitter_name = users.full_name FROM users WHERE job_cards.technician_id = users.user_id AND users.role = 'technician' AND job_cards.submitter_name IS NULL")
        connection.exec_driver_sql(
            "ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP"
        )
        connection.exec_driver_sql(
            "ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS photo_data TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS photo_data TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS attachments_data TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS attachments_data TEXT"
        )


@app.get("/")
def root():
    return {
        "message": "S — Intelligent Biomedical Technician Friend",
        "status": "online"
    }


@app.get("/database-test")
def database_test(admin_id: int = Depends(require_admin)):
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        row = result.fetchone()

        if row is None:
            raise RuntimeError("Database version query returned no rows.")

        version = row[0]

    return {
        "database": "simeon_db",
        "status": "connected",
        "postgresql_version": version
    }

app.include_router(delivery_router)

from backend.routes.recovery import router as recovery_router
app.include_router(recovery_router)

from backend.routes.subscriptions import router as subscriptions_router
app.include_router(subscriptions_router)

from backend.routes.inventory_chat import router as inventory_chat_router
app.include_router(inventory_chat_router)

from backend.routes.commissions import router as commissions_router
app.include_router(commissions_router)

from backend.routes.branding import router as branding_router
app.include_router(branding_router)

from backend.routes.location import router as location_router
app.include_router(location_router)

from backend.routes.job_forms import router as job_forms_router
app.include_router(job_forms_router)

@app.on_event('startup')
def start_google_sheet_sync():
    from backend.sheet_sync import start_worker
    from backend.database import SessionLocal
    start_worker(SessionLocal)

@app.on_event('shutdown')
def stop_google_sheet_sync():
    from backend.sheet_sync import stop_worker
    stop_worker()

from backend.routes.app_branding import router as app_branding_router
app.include_router(app_branding_router)
