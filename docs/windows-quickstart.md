# Simeon for Windows

The installer is built locally at `desktop/release/Simeon-Setup.exe`.
Run it, choose an installation folder, and open Simeon from the desktop or Start menu.
Use your existing account. Internet is required; the desktop app opens the live
Simeon website and saves records in the existing database.

This build targets Windows 10/11 x64. It is not code-signed: Windows may display
an unknown-publisher or SmartScreen message. Verify the published checksum and
source before installing. A signing certificate can be added before wider distribution.

## Build again

```powershell
cd desktop
npm.cmd ci
npm.cmd test
npm.cmd run build
```

Electron's install script must be allowed to download the runtime. If npm reports
that the script was skipped, run `node node_modules/electron/install.js` once.
Installer builds require network access to fetch Electron/NSIS tools.

## Publish after testing

The owner has chosen to publish unsigned while paid signing is deferred.
The current installer and GitHub release workflow are unsigned and the release
notes disclose this. When signing is enabled later, verify timestamped signatures
on both the installer and packaged app before publishing.
Choose a publicly trusted code-signing provider and complete its identity
verification first. The provider-specific local/CI signing integration is not yet
configured. `npm run build:signed` refuses to silently produce an unsigned build.
Do not put certificate passwords, private keys or service credentials in chat or Git.

The installer is intentionally ignored by Git. The Windows installer workflow
builds and publishes it when the tag `windows-v1.0.0` is pushed. Publish that
release before pushing the frontend button change to the website branch.
The production button points to that release asset. For local
testing, the build is copied into the ignored `frontend/public/downloads` folder.

No release or push has been performed as part of creating this installer.
The existing Android and unrelated iOS work remain separate.
