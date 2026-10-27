### New package: `@octane-xplat/firebase-crashlytics`

Firebase Crashlytics — `log`, `recordError`, user/attribute context,
unsent-report controls on iOS/Android. No Crashlytics SDK exists for
web/desktop — the leaf reports `supported: false` there (route those errors
to `sentry` or `posthog`).
