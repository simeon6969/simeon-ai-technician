# Admin app branding

Open **Admin > App branding**. Enter the display name (up to 60 characters), optionally upload a PNG, JPEG or WebP logo (up to 5 MB), and select **Save changes**. Remove logo restores the first letter of the display name as the mark.

Branding is stored in the database. Only administrators can change it; all visitors can read it. The homepage, login, dashboard marks, assistant labels, translated interface copy, browser title/favicon and PDF app branding use these settings. The PDF account heading and account logo remain the document owner's identity. AI instructions receive the current display name.

Open clients check once a minute while visible and on window focus. Cached branding is used offline. Existing records, messages and published spreadsheet column headings are historical data and are not rewritten.

Deploy the backend and frontend together. Backend startup creates the app_branding table. An APK containing this feature must be installed once; later changes to the branding inside that app are fetched from the backend. Android/iOS launcher names, launcher icons, Windows installer metadata and installed PWA metadata still require separate packaging or installation updates. This setting does not change domains, email addresses, application IDs or download URLs.
