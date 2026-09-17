# simeon-ai-technician
Simeon - Intelligent Biomedical Technician Support Platform

The interface supports English, Kinyarwanda, French, and Swahili. Use the language selector
on the login screen or dashboard; your choice is remembered in this browser.
Translations are maintained in `frontend/src/translations.js` and `frontend/src/swahili.js`, with English as
the fallback. Technician-entered records, AI responses, server-provided messages,
and downloaded PDF contents retain their original language.

Administrators can use **Ask Simeon** on their dashboard to query users (including
contact details), equipment, all job cards, maintenance knowledge, spare parts,
requests, and chat records. The `/admin/chat` endpoint verifies the current account's
admin role on every request. Technician chat keeps its validated-maintenance scope.

Admin chat requires `OPENAI_API_KEY` and uses `OPENAI_MODEL`. It sends relevant
query results to the configured AI service, uses read-only structured queries,
and excludes password hashes and raw photo/attachment contents. Answers include
record references and expandable database sources. Lists are paginated (50 records
per query); counts cover all matching records. Long text is limited to 4,000
characters per field and marked as truncated. Complex questions can require a
follow-up. Admin conversations remain in the current page until cleared or reloaded.

Run admin chat tests with `.venv/Scripts/python.exe -m unittest discover -s backend/tests`.

