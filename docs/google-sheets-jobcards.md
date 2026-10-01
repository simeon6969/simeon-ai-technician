# Job cards: database and Google Sheets

The database remains the main record. Saving a job card also saves its question version, custom answers and pending spreadsheet copy in the same database transaction. A background worker copies it to Google every 10 seconds when credentials are available. Google downtime does not prevent saving job cards. Failed copies retry after one minute; admin can request an earlier retry.

Target spreadsheet:
https://docs.google.com/spreadsheets/d/1UeIoc3SI8sU074vUiSW0ah-go-UuD9bc5bDsHBTbcyU/edit

## Activate the connection
1. Open Google Cloud Console and create or select a project.
2. Enable **Google Sheets API** for that project.
3. Under **IAM & Admin > Service Accounts**, create a service account for S. It does not need a project-wide role to access a sheet shared with its email.
4. Open that service account, choose **Keys > Add key > Create new key > JSON**, and download the credential. Keep it private. Do not paste it into chat, commit it to Git, or put it in frontend settings.
5. Open the spreadsheet above. Click **Share**, add the service account email as **Editor**, and keep general access restricted. Job cards may contain private business information.
6. For the deployed backend on Render, add a secret environment variable called `GOOGLE_SERVICE_ACCOUNT_JSON`, whose value is the complete JSON credential. Save and redeploy the **backend**.
7. For local development, preferably use a separate test spreadsheet. Store the credential outside the repository and set `GOOGLE_APPLICATION_CREDENTIALS` to its absolute file path in the backend environment. Restart the backend. Alternatively use the same JSON environment variable as Render.
8. In admin, open **Job cards & Google Sheets**. Confirm the account email appears, check the spreadsheet link, and keep sync enabled.
9. Submit a job card, then click **Refresh sync status** after a few seconds. Confirm it is counted as synced and appears in the spreadsheet. If not, check the error shown, permissions and API setup, then click **Retry pending sync**.

The sharing link alone cannot grant backend write access. No Google Form is required; S's question conversation is the form.

## Questions and spreadsheet columns
- Edit question headings and help text in **Job cards & Google Sheets**, then **Publish questions**.
- Add or remove custom text questions and set whether answers are required. Standard equipment, problem and confirmation fields cannot be removed or made optional because maintenance records depend on them.
- Custom wording is displayed as entered; enter it in the language you want users to read. Existing standard labels retain the app's translations.
- Each published version creates a separate tab, such as `S Job Cards v1`, on its first synced submission. This keeps old answers aligned with their original questions. Drafts already started keep their original version, including offline drafts.
- One submitted job card occupies one row. Columns include job ID, account, submitter, date, status, and each question. Photos are marked `Photo attached`; full image data remains in the database.
- Do not rename these tabs, edit their headers or physically reorder their rows. Use Google filter views instead. S checks headers and row IDs before writing and pauses conflicting writes rather than overwriting another row.
- Row addresses are based on job IDs, so some rows may be blank. Retries overwrite the same row instead of adding duplicates.
- Existing records can be included using **Include existing job cards** (up to 500 per click). Records are queued once. Older APKs continue to use the original v0 questions.
- Editing or validating a tracked job card queues its standard answers/status again. Custom answers keep their original submission values.
- Deleting a job card removes its pending database sync entry; already copied Google rows remain as historical records and must be removed in Google separately if desired.
- Google Sheets can download the spreadsheet as Excel using **File > Download > Microsoft Excel**.

## Deployment and verification
Install the updated `requirements.txt` and restart the backend. Startup creates the additional tables and starts the worker. The API, sync status and question editor require login; settings are admin-only. Tokens and private keys are never sent to the frontend.

Code tests use fake Google responses. An actual write to your spreadsheet must be verified after credential setup; it cannot be confirmed from a sharing link alone.

Official references:
- https://developers.google.com/workspace/guides/create-credentials#service-account
- https://developers.google.com/workspace/guides/enable-apis
- https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/update
