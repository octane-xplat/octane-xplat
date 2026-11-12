# Diagnose a production error

ID: production-errors
Targets: web, ios, android
Related APIs: @octane-xplat/sentry, sentry.init, sentry.captureException, sentry.addBreadcrumb, SentryInitOptions, @octane-xplat/firebase-crashlytics, sentry-cli

## Starting point

A buildable app and a test reporting project. The chosen complete path is an
app-owned policy module over the Xplat Sentry wrapper; native crash and
build/artifact limitations remain explicit.

## Requirements

Identify a handled report in its project, bind it to a deployed artifact,
preserve readable source locations, control data collection and distinguish
JavaScript errors from native crash/relaunch evidence.

## Acceptance criteria

- AC1: The reader configures a test project and SDK owner, sends a handled error, identifies its event/release/environment and distinguishes queued from delivered.
- AC2: Reporting has explicit filtering and enable/stop ownership, excludes sensitive free-form data and keeps private upload credentials outside app bundles.
- AC3: Browser builds emit matching maps, inject Debug IDs, upload artifacts with matching release/dist, deploy the same output and verify a readable report from that artifact.
- AC4: Native setup distinguishes JavaScript maps, iOS dSYMs and Android mapping/native symbols; the Vite release-map pipeline is qualified at build level while credentialed upload, installed-artifact delivery and native crash/relaunch keep a separate qualification procedure.
- AC5: Recovery covers absent reports, wrong identity, unreadable stacks and provider initialization; Crashlytics support/registration and experimental desktop limits are explicit.

## Documentation

- AC1: [Test-project path](../../../docs/testing/production-errors.md#connect-a-test-project), [browser module](../../../packages/sentry/examples/reporting.web.ts), and [native reporting](../../../docs/testing/production-errors.md#report-from-ios-or-android).
- AC2: [Filtering and collection](../../../docs/testing/production-errors.md#own-filtering-and-collection), [browser regressions](../../../packages/sentry/tests/reporting-guide.test.mts), [wrapper collection policy](../../../packages/sentry/tests/collection-policy.test.mts) and [build secret ownership](../../../docs/testing/production-errors.md#build-and-upload-the-matching-browser-artifacts). Native difference: `beforeSend` cannot drop or redact a native crash report — the wrapper documents that boundary; Android `flush` covers the JavaScript queue only.
- AC3: [Browser artifact workflow](../../../docs/testing/production-errors.md#build-and-upload-the-matching-browser-artifacts) and [local artifact check](../../../packages/sentry/tests/source-map-artifacts.mts). Project upload and deployed-report resolution require external verification.
- AC4: [Native maps/symbols and crash checks](../../../docs/testing/production-errors.md#report-from-ios-or-android) and the [native artifact check](../../../packages/sentry/tests/native-source-map-artifacts.mts). Remaining gap: credentialed upload, installed-artifact delivery, iOS dSYM/Android symbol uploads and crash/relaunch are external target steps (#74), independently of the qualified build pipeline.
- AC5: [Crashlytics alternative](../../../docs/testing/production-errors.md#use-crashlytics-as-a-native-alternative) and [recovery](../../../docs/testing/production-errors.md#recover-missing-or-unreadable-reports) distinguish Crashlytics plugin registration and reporting failure classes.
