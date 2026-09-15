```python
import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.base import Base
from backend.auth import require_admin
from backend.database import engine
import backend.models

from backend.routes.users import router as users_router
from backend.routes.equipment import router as equipment_router
from backend.routes.job_cards import router as job_cards_router
from backend.routes.spare_parts import router as spare_parts_router
from backend.routes.admin import router as admin_router
from backend.routes.chat import router as chat_router


app = FastAPI(title="Simeon API")


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


@app.on_event("startup")
def create_missing_tables():
    Base.metadata.create_all(bind=engine)

    with engine.begin() as connection:
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
        "message": "Simeon — Intelligent Biomedical Technician Friend",
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
```
