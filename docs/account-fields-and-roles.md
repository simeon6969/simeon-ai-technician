# Account fields and roles

Registration now requires two choices:

- Field: Medical, IT, Electrical, Mechanical.
- Role: Technician, Store, Client.

| Function | Technician | Store | Client |
| --- | --- | --- | --- |
| Maintenance help and job cards | Yes | No | No |
| Save/post spare parts and sale items | Yes | Yes | No |
| Offline inventory drafts | Yes | Yes | No |
| Browse posted items and request them | Yes | Yes | Yes |
| Handle incoming seller requests | Yes | Yes | No |

The field appears beside the account name. The sales board and request dashboard show all fields by default, with a field filter. Inventory listings use their owner's selected field. Clients can request both sale items and spare parts; sellers can accept, decline, or fulfill the requests. Admin accounts remain separate from registration and retain backend access to all requests and existing administration functions. The admin console provides field/role filters, account and inventory editing, publishing controls, request management, and an overview. Editing validated job cards removes their old knowledge entries and requires revalidation.

Existing non-admin accounts with no field receive a one-time setup screen. They choose a field and role; their user ID and records are preserved. Once setup is complete, users cannot change their role through this endpoint. Existing job cards keep their original account heading and submitter attribution. A user choosing Store or Client no longer receives the technician workspace; existing records remain in the database for administration.

Complete/sync any pending job cards before switching to Store or Client. The backend blocks job-card uploads from those roles. Offline queued submissions remain on the device if the role no longer permits them. Existing legacy roles remain recognized until the account completes setup; registration no longer offers those roles.

## Deploying

Deploy backend and frontend together, then distribute the new Android APK. Backend startup adds nullable `users.account_field`, extends the role constraint to Store/Client, and creates the `item_requests` table. It does not delete or relabel old account records automatically. Older APKs cannot present the new registration/setup screens and need an update.

Verify with `.venv/Scripts/python.exe -m unittest discover -s backend/tests`, frontend lint/build, and the browser checks in `frontend/tests/account-roles-browser.cjs` and `frontend/tests/offline-browser.cjs` (Vite on port 5199, desktop Playwright dependencies, Microsoft Edge).
