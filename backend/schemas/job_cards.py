from pydantic import BaseModel, field_validator

from backend.schemas.spare_parts import (
    validate_attachments_data,
    validate_photo_data,
)


class JobCardCreate(BaseModel):
    equipment_id: int
    maintenance_type: str
    fault_description: str
    symptoms: str | None = None
    diagnosis: str | None = None
    actions_taken: str | None = None
    parts_used: str | None = None
    result: str | None = None
    successful: bool = False
    photo_data: str | None = None

    _validate_photo_data = field_validator("photo_data")(validate_photo_data)
    attachments_data: str | None = None
    _validate_attachments_data = field_validator("attachments_data")(
        validate_attachments_data
    )