# Android versions

The public version series begins with **1.0** in GitHub Actions build 9.
Each new Android workflow run increments the displayed version: build 10 is
**1.1**, build 11 is **1.2**, and so on. A failed build may leave a gap.
Re-running the same workflow run retries the same version.

Android's internal `versionCode` continues to use the increasing workflow run
number. It must not reset to 1: existing installs already have codes up to 8.
The existing application ID and signing key are preserved for installation over
the previous APK. The updater still compares build numbers, independently of
the displayed version.

Release tags retain `android-test-N` so installed apps can discover updates;
release titles display the public version, such as `Simeon Android 1.0`.
This numbering change does not change the APK's signing or Play Store status.
