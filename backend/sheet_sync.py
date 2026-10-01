import json
import os
import threading
from datetime import datetime, timedelta
from urllib.parse import quote
from sqlalchemy import or_
from backend.models import JobCard
from backend.models.job_forms import JobSheetSettings, JobSheetSubmission

DEFAULT_SPREADSHEET = '1UeIoc3SI8sU074vUiSW0ah-go-UuD9bc5bDsHBTbcyU'
SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
_stop = threading.Event()
_thread = None

def credentials_info():
    raw = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON')
    path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if raw:
        return json.loads(raw)
    if path:
        with open(path, encoding='utf-8') as file:
            return json.load(file)
    return None

def credentials_status():
    try:
        info = credentials_info()
        valid = bool(info and info.get('type') == 'service_account' and info.get('private_key') and info.get('client_email'))
        return {'credentials_configured': valid, 'service_account_email': info.get('client_email') if valid else None}
    except (ValueError, OSError):
        return {'credentials_configured': False, 'service_account_email': None}

class GoogleSheetWriter:
    def __init__(self):
        from google.oauth2.service_account import Credentials
        from google.auth.transport.requests import AuthorizedSession
        credentials = Credentials.from_service_account_info(credentials_info(), scopes=[SCOPE])
        self.session = AuthorizedSession(credentials)
    def call(self, method, url, **kwargs):
        response = self.session.request(method, url, timeout=20, **kwargs)
        if not response.ok:
            raise RuntimeError('Google Sheets rejected the request (HTTP %s). Check sharing permissions and the Sheets API.' % response.status_code)
        return response.json()
    def write(self, spreadsheet, submission, card):
        base = 'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheet
        title = 'S Job Cards v' + str(submission.form_version)
        metadata = self.call('GET', base, params={'fields': 'sheets.properties'})
        sheet = next((s['properties'] for s in metadata.get('sheets', []) if s['properties']['title'] == title), None)
        row_number = card.job_card_id + 1
        headers = ['Job card ID', 'Account', 'Submitter', 'Created at', 'Status'] + [q[1] for q in submission.questions]
        if not sheet:
            self.call('POST', base + ':batchUpdate', json={'requests': [{'addSheet': {'properties': {'title': title, 'gridProperties': {'rowCount': max(1000, row_number + 10), 'columnCount': max(26, len(headers))}}}}]})
        else:
            grid = sheet['gridProperties']
            if grid['rowCount'] < row_number or grid['columnCount'] < len(headers):
                self.call('POST', base + ':batchUpdate', json={'requests': [{'updateSheetProperties': {'properties': {'sheetId': sheet['sheetId'], 'gridProperties': {'rowCount': max(grid['rowCount'], row_number + 10), 'columnCount': max(grid['columnCount'], len(headers))}}, 'fields': 'gridProperties.rowCount,gridProperties.columnCount'}}]})
        def values(range_name):
            return base + '/values/' + quote("'%s'!%s" % (title, range_name), safe='')
        column, end_column = len(headers), ''
        while column:
            column, remainder = divmod(column - 1, 26)
            end_column = chr(65 + remainder) + end_column
        existing = self.call('GET', values('A1:%s1' % end_column)).get('values', [])
        if existing and existing[0] != headers:
            raise RuntimeError('Worksheet headers were changed. Restore the S worksheet headers before retrying.')
        existing_id = self.call('GET', values('A%d' % row_number)).get('values', [])
        if existing_id and str(existing_id[0][0]) != str(card.job_card_id):
            raise RuntimeError('Worksheet rows were moved. Restore the original row order before retrying.')
        self.call('PUT', values('A1'), params={'valueInputOption': 'RAW'}, json={'values': [headers]})
        data = [card.job_card_id, card.account_name or '', card.submitter_name or '', card.created_at.isoformat(), card.status]
        data += [submission.answers.get(q[0]) if submission.answers.get(q[0]) is not None else '' for q in submission.questions]
        self.call('PUT', values('A%d' % row_number), params={'valueInputOption': 'RAW'}, json={'values': [data]})
    def close(self):
        self.session.close()

def sync_pending(session_factory, writer_factory=GoogleSheetWriter):
    if writer_factory is GoogleSheetWriter and not credentials_status()['credentials_configured']:
        return
    with session_factory() as db:
        settings = db.get(JobSheetSettings, 1)
        if settings and not settings.enabled:
            return
        spreadsheet = settings.spreadsheet_id if settings else DEFAULT_SPREADSHEET
        ids = [row[0] for row in db.query(JobSheetSubmission.job_card_id).filter(JobSheetSubmission.synced.is_(False),
               or_(JobSheetSubmission.retry_at.is_(None), JobSheetSubmission.retry_at <= datetime.utcnow())).order_by(JobSheetSubmission.job_card_id).limit(20)]
        for card_id in ids:
            # One transaction per row; PostgreSQL prevents parallel workers from duplicating work.
            submission = db.query(JobSheetSubmission).filter_by(job_card_id=card_id, synced=False).with_for_update(skip_locked=True).first()
            if not submission:
                db.rollback()
                continue
            card = db.get(JobCard, card_id)
            if not card:
                db.rollback()
                continue
            writer = None
            try:
                writer = writer_factory()
                writer.write(spreadsheet, submission, card)
                submission.synced = True
                submission.synced_at = datetime.utcnow()
                submission.error = None
                submission.retry_at = None
            except RuntimeError as error:
                submission.error = str(error)[:500]
                submission.retry_at = datetime.utcnow() + timedelta(seconds=60)
            except Exception:
                submission.error = 'Google Sheets connection failed. Check backend credentials, network and sheet access.'
                submission.retry_at = datetime.utcnow() + timedelta(seconds=60)
            finally:
                if writer:
                    writer.close()
            submission.attempts += 1
            db.commit()

def start_worker(session_factory):
    global _thread
    if _thread and _thread.is_alive():
        return
    _stop.clear()
    def run():
        while not _stop.wait(10):
            try:
                sync_pending(session_factory)
            except Exception:
                pass  # DB unavailable: retry next cycle, never block form submission.
    _thread = threading.Thread(target=run, daemon=True, name='simeon-sheet-sync')
    _thread.start()

def stop_worker():
    _stop.set()
