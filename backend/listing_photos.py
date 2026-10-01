import base64
import binascii
import hashlib
from io import BytesIO

from fastapi import HTTPException, Request, Response
from PIL import Image, ImageOps, UnidentifiedImageError


def photo_response(data, original, request: Request):
    if not data:
        raise HTTPException(404, 'Photo not found')
    etag = '"' + hashlib.sha256((str(original) + data).encode()).hexdigest() + '"'
    headers = {'ETag': etag, 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff'}
    if request.headers.get('if-none-match') == etag:
        return Response(status_code=304, headers=headers)
    try:
        prefix, encoded = data.split(',', 1)
        media_type = prefix.removeprefix('data:').split(';')[0]
        if media_type not in {'image/jpeg', 'image/png', 'image/webp'}:
            raise ValueError('Unsupported image')
        raw = base64.b64decode(encoded, validate=True)
        if not original:
            with Image.open(BytesIO(raw)) as source:
                if source.width * source.height > 40_000_000:
                    raise ValueError('Image too large')
                source.draft('RGB', (480, 480))
                preview = ImageOps.exif_transpose(source)
                preview.thumbnail((480, 480))
                output = BytesIO()
                preview.convert('RGB').save(output, 'WEBP', quality=72)
                raw, media_type = output.getvalue(), 'image/webp'
        return Response(raw, media_type=media_type, headers=headers)
    except (ValueError, binascii.Error, OSError, UnidentifiedImageError, Image.DecompressionBombError):
        raise HTTPException(404, 'Photo unavailable') from None
