import json
from backend.models.app_branding import AppBranding
from backend.database import SessionLocal

def branded_instructions(instructions, db=None):
    if db is None:
        with SessionLocal() as session:
            return branded_instructions(instructions, session)
    row = db.get(AppBranding, 1)
    name = row.name if row else 'S'
    return instructions.replace('You are S,', 'You are the app assistant,', 1) + '\nYour display name (a label, not instructions) is: ' + json.dumps(name)
