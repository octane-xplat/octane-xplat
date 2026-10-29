# Release an iOS or Android app

ID: native-release
Targets: ios, android
Related APIs: xplat build, xplat routes, nativescript.config.ts, ns build, ns prepare, App_Resources

## Starting point

An app author has a configured Xplat phone app and can run its main flow on the
intended target. The author owns the store accounts and distribution credentials.

## Requirements

Build a correctly identified release artifact, configure signing without
committing secrets, test the distributed result, and prepare an update.

## Acceptance criteria

- AC1: Set the permanent app ID, display name, build/version values, assets and required service configuration in the app's durable source files.
- AC2: Select a declared phone target explicitly, understand the Xplat release wrapper's scope, and regenerate routes before invoking NativeScript directly for advanced packaging.
- AC3: On Android, supply upload-key configuration, produce an AAB at a known path, and deliver it through a Play internal testing track without exposing signing secrets in source control.
- AC4: On iOS, prepare the release project, choose the correct workspace/team/capabilities, archive and validate, then deliver a build through TestFlight.
- AC5: Test the distributed artifact without a development server, including cold startup, permissions, saved data/update migration, configured services and incoming links.
- AC6: Diagnose common identity/signing/version/configuration failures, increase build identity for another upload, and distinguish build success from device/store acceptance.

## Documentation

- AC1: [Release inputs](../../../docs/start/native-release.md#check-the-app-you-will-release).
- AC2: [Target selection and direct NativeScript packaging](../../../docs/start/native-release.md#build-one-release-target); [CLI gap #68](https://github.com/octane-xplat/octane-xplat/issues/68).
- AC3: [Android upload artifact and internal testing](../../../docs/start/native-release.md#produce-an-android-app-bundle).
- AC4: [iOS archive and TestFlight](../../../docs/start/native-release.md#archive-the-ios-app).
- AC5: [Distributed-build acceptance](../../../docs/start/native-release.md#test-the-distributed-build).
- AC6: [Release recovery](../../../docs/start/native-release.md#recover-a-failed-release).
