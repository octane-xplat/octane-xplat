# Diagnose a production error

ID: production-errors
Targets: web, ios, android
Related APIs: @octane-xplat/sentry, sentry.init, sentry.captureException, sentry.addBreadcrumb, SentryInitOptions, @octane-xplat/firebase-crashlytics, sentry-cli

## Starting point

A buildable app and a test reporting project. The chosen complete path is a
browser Sentry SDK module; native wrapper/build limitations remain explicit.

## Requirements

Identify a handled report in its project, bind it to a deployed artifact,
preserve readable source locations, control data collection and distinguish
JavaScript errors from native crash/relaunch evidence.

## Acceptance criteria

- AC1: The reader configures a test project and SDK owner, sends a handled error, identifies its event/release/environment and distinguishes queued from delivered.
- AC2: Reporting has explicit filtering and enable/stop ownership, excludes sensitive free-form data and keeps private upload credentials outside app bundles.
- AC3: Browser builds emit matching maps, inject Debug IDs, upload artifacts with matching release/dist, deploy the same output and verify a readable report from that artifact.
- AC4: Native setup distinguishes JavaScript maps, iOS dSYMs and Android mapping/native symbols; missing Vite integration is tracked and native crash/relaunch has a separate qualification procedure.
- AC5: Recovery covers absent reports, wrong identity, unreadable stacks and provider initialization; Crashlytics support/registration and experimental desktop limits are explicit.

## Documentation

- AC1: [Test-project path](../../../docs/testing/production-errors.md#connect-a-test-project), [browser module](../../../packages/sentry/examples/reporting.web.ts), and [native reporting](../../../docs/testing/production-errors.md#report-from-ios-or-android).
- AC2: [Filtering and collection](../../../docs/testing/production-errors.md#own-filtering-and-collection), [browser regressions](../../../packages/sentry/tests/reporting-guide.test.mjs) and [build secret ownership](../../../docs/testing/production-errors.md#build-and-upload-the-matching-browser-artifacts). The native wrapper lacks those typed controls (#73); native production policy integration remains a gap.
- AC3: [Browser artifact workflow](../../../docs/testing/production-errors.md#build-and-upload-the-matching-browser-artifacts) and [local artifact check](../../../packages/sentry/tests/source-map-artifacts.mjs). Project upload and deployed-report resolution require external verification.
- AC4: [Native maps/symbols and crash checks](../../../docs/testing/production-errors.md#report-from-ios-or-android). Gap: the NativeScript/Vite release-map integration remains unqualified (#74), independently of the documented archive/symbol procedure.
- AC5: [Crashlytics alternative](../../../docs/testing/production-errors.md#use-crashlytics-as-a-native-alternative) and [recovery](../../../docs/testing/production-errors.md#recover-missing-or-unreadable-reports) distinguish plugin registration issue #75 and reporting failure classes.
