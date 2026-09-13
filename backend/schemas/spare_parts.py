import json

from pydantic import BaseModel, field_validator


def validate_photo_data(value: str | None) -> str | None:
    if value is None:
        return None

    allowed_prefixes = (
        "data:image/jpeg;base64,",
        "data:image/png;base64,",
        "data:image/webp;base64,",
    )
    if not value.startswith(allowed_prefixes):
        raise ValueError("Photo must be a JPEG, PNG, or WebP image")

    if len(value) > 7_000_000:
        raise ValueError("Photo must be 5 MB or smaller")

    return value


def validate_attachments_data(value: str | None) -> str | None:
    if value is None:
        return None

    try:
        attachments = json.loads(value)
    except json.JSONDecodeError as error:
        raise ValueError("Attachments must be valid JSON") from error

    if not isinstance(attachments, list) or len(attachments) > 5:
        raise ValueError("A record can contain at most 5 attachments")

    allowed_prefixes = (
        "data:image/jpeg;base64,",
        "data:image/png;base64,",
        "data:image/webp;base64,",
        "data:application/pdf;base64,",
    )

    for attachment in attachments:
        if not isinstance(attachment, dict):
            raise ValueError("Each attachment must be an object")
        if not isinstance(attachment.get("name"), str) or not attachment["name"]:
            raise ValueError("Each attachment needs a file name")
        data = attachment.get("data")
        if not isinstance(data, str) or not data.startswith(allowed_prefixes):
            raise ValueError("Attachments must be JPEG, PNG, WebP, or PDF files")

    if len(value) > 35_000_000:
        raise ValueError("Attachments must be 25 MB or smaller in total")

    return value


class SparePartCreate(BaseModel):
    equipment_id: int | None = None
    part_number: str | None = None
    part_name: str
    manufacturer: str | None = None
    description: str | None = None
    specifications: str | None = None
    compatibility: str | None = None
    availability_status: str = "available"
    photo_data: str | None = None

    _validate_photo_data = field_validator("photo_data")(validate_photo_data)
    attachments_data: str | None = None
    _validate_attachments_data = field_validator("attachments_data")(
        validate_attachments_data
    )