# Install the Simeon Android test app

1. Open the repository's Android test release link on your Android phone.
2. Download **Simeon-test.apk** and open the downloaded file.
3. If Android asks, allow this browser/file manager to install the app, then tap Install.
4. Open **Simeon** and log in with your existing account.
5. Try a job card, a photo upload and PDF sharing. Tell us which phone you used and any error you see.

This is a test APK, not a Google Play release. It uses the live server, so records
you save are real. Internet is required. A future production build may require
uninstalling this test version first. iOS packaging is deferred.

The Android workflow builds on pushes to `android-apk` or `main` and publishes
the APK as a GitHub prerelease. Its SHA-256 file accompanies the download.
Native HTTP connects to the current HTTPS API without additional browser CORS
settings. Website settings are unchanged.
