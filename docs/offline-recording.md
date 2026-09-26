# Offline job cards and spare parts

1. Sign in once while connected to the internet. The Android app remembers the account name needed to reopen the workspace offline.
2. Open **Store a Job Card or Spare Part** and answer Simeon's questions. Answers, unfinished text, and photos are saved on this device. Wait for the draft-saved message before closing.
3. To resume, sign into the same account and reopen the same form. Each account has one unfinished draft per form type.
4. Review your answers and press **Save**. The record goes into the device's queue. Saving does not automatically publish a spare part to the sales board.
5. Keep Simeon open when internet returns. It tries to sync on reconnect, when the window regains focus, and every 30 seconds. **Sync now** also retries. Successful uploads show the server record number.
6. If your login expired, sign in to the same account again. Records remain tied to their original account and cannot be uploaded as another account.

The app must be open to sync; this is not an Android background service. Chat, viewing server records, posting for sale, and downloading updates still need internet. The Android APK contains the interface needed to open offline. The website and Windows wrapper still need a connection to load their interface after a full restart.

Drafts and queued records use IndexedDB on the device, including photos. They survive ordinary app closure and account logout. Clearing app/site data or uninstalling may remove them. A storage error is shown instead of claiming a successful save. Synced queue entries keep a small receipt; their local answers and photos are removed. Server-rejected entries retain their original answers and can be retried after the account/server issue is resolved.

## Deployment and verification

Deploy the backend before distributing the updated frontend/APK. Startup creates `offline_submissions`; no changes to existing records are required. The authenticated `/offline/submit` endpoint atomically saves equipment, job cards, validation knowledge, or spare parts with a per-account submission receipt. Retrying the same ID returns the same server record; changing its contents returns 409. Receipts survive individual record deletion so retries cannot recreate deleted records. Account deletion removes that account's receipts.

Run backend tests with `.venv/Scripts/python.exe -m unittest discover -s backend/tests`. Run frontend lint/build as usual. The browser integration check uses the existing desktop Playwright dependency and Microsoft Edge: start Vite on port 5199, then run `node frontend/tests/offline-browser.cjs`. All API traffic in this check is mocked; it never creates real account records.

Install a newly built Android APK to use this feature on a phone. Test airplane mode and reconnection on a physical device before wider distribution.
