from pydantic import BaseModel, Field, field_validator

from backend.schemas.spare_parts import (
    validate_attachments_data,
    validate_photo_data,
)


class JobCardCreate(BaseModel):
    form_version: int = Field(default=0, ge=0)
    custom_answers: dict[str, str | None] = Field(default_factory=dict, max_length=40)

    @field_validator('custom_answers')
    @classmethod
    def custom_limits(cls, values):
        if any(len(key) > 80 or (value is not None and len(value) > 12000) for key, value in values.items()):
            raise ValueError('Custom answer is too long')
        return values

    submitter_name: str | None = Field(default=None, max_length=150)
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
