# simeon-ai-technician
Simeon - Intelligent Biomedical Technician Support Platform

Simeon supports installation as a Progressive Web App (PWA) on Android and iOS.
Production website: https://simeon-frontend.onrender.com
Production API: https://simeon-api.onrender.com
The committed `frontend/.env.production` selects this API for production builds;
local development keeps using `http://127.0.0.1:8000`. Render environment variables
override this file, so remove or correct any old `VITE_API_BASE_URL` in Render.
Set backend `ALLOWED_ORIGINS=https://simeon-frontend.onrender.com`.
In the Render static-site Headers settings, set `/sw.js` to
`Cache-Control: no-cache` and `/manifest.webmanifest` to
`Content-Type: application/manifest+json`. The included `_headers` file also
supports hosts that read that file; do not assume Render applies it automatically.
The homepage's **Install app** link opens instructions. Supported Android browsers
also show an Install Simeon button when installation is available. On iPhone/iPad,
open the site in Safari, choose Share → Add to Home Screen, keep Open as Web App
enabled if offered, and tap Add. Launch the Simeon icon from the home screen.

Deploy `frontend/dist` at the root of an HTTPS website after building with
`VITE_API_BASE_URL` set to the public HTTPS backend URL. Include the website origin
in backend `ALLOWED_ORIGINS`. A phone cannot use the default `127.0.0.1` API URL.
The deployment must serve `/manifest.webmanifest`, `/sw.js`, `/offline.html`, and
`/app-icons/*` as actual files, not SPA fallback HTML. Serve `sw.js` with JavaScript
content type and revalidation (`Cache-Control: no-cache`). The worker registers
only in production builds; test locally using `npm run build` and `npm run preview`.

The installed app requires internet for account access, chat, listings and saving.
The worker caches only the static offline page, never API responses or account data.
App code is loaded from the network so new deployments appear on the next launch
or reload. This provides website-based installation, not an APK/IPA or store listing.
App Store/Google Play distribution requires a separate native packaging, signing
and publishing workflow with developer accounts.

Registration supports Technician (personal), Organization, Institution, Health
facility, and Other business accounts. All five use the same workspace, displaying
the account's registered name and type. For shared accounts, Simeon asks for the
person's full name on every new job card. Technician cards automatically use the
account holder's name, enforced by the server. Job cards store the account name
and submitter name separately; PDFs show the account name as their heading and
the submitter beneath it. Names are preserved when a card is later confirmed.
Restart the backend to add the attribution columns and populate existing technician
cards. Public registration cannot create administrator accounts.

The public homepage (`#home`) introduces Simeon and shows a searchable sales board.
The board combines explicitly posted spare parts and sale items from every account
type. Spare parts without a price show “Price not provided.” Drafts remain excluded.
Posted items include a “View on homepage” link; returning focus to the homepage
refreshes the board so posts from another tab are picked up.
Visitors can browse published item photos, descriptions, prices and seller names
without an account. Login (`#login`) is required to enter Simeon (`#app`), create
records, publish or delete listings, and use chat. Both dashboards provide a way
back to the homepage. Browser Back/Forward and direct hash links are supported.
The public `/sale-items/public` API returns only published listing fields;
unpublished items and account contact details are not exposed. Publishing a sale
item makes its listing and seller name visible to visitors.

Technicians can use **Items for sale → Store an item** to record equipment or other
items through Simeon's guided questions. A name, description, positive price,
currency and JPEG/PNG/WebP photo (up to 5 MB) are required. RWF is the default;
USD, EUR, KES, TZS and UGX are also supported. Review before saving, then use
**Post** to publish to **View sale posts**, or **Delete** to remove the item and
its post. Only owners can publish/delete their items. Restart the backend to
create the new `sale_items` table. This is a listings board; it does not process payments.

In **My Spare Parts**, each stored part has a **Post spare part** button. Posting
adds it to the shared **View posts** board with its photo, details and technician
name. Only the owner can post a part; repeated clicks do not create duplicates.
Stored parts are not posted automatically. The board displays newest posts first
and offers Load more and Refresh. Deleting a part removes its post too.
Restart the backend after updating: startup adds the nullable `spare_parts.posted_at`
column to existing databases. Existing spare-part search continues to work as before.

Technicians store job cards and spare parts through a guided conversation with
Simeon: choose a store action, answer one question at a time, skip optional items,
upload an optional photo, and review or edit answers before saving. The flow works
in all four languages without an AI connection. Answers stay in memory until saved;
leaving an unfinished conversation asks for confirmation. Saved records appear on
the dashboard. Maintenance is validated only when the technician explicitly confirms
success. If validation fails after saving, the existing card can be confirmed from
My Job Cards without creating it again.

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

