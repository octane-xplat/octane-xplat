# Deliver a phone update between binary releases

ID: ota-updates
Targets: ios, android
Related APIs: @octane-xplat/updates, createUpdates, check, install, markHealthy, rollback, xplat updates init

## Starting point

A working NativeScript phone app with a configured OTA Worker/R2 endpoint and
an owner who controls native signing and release versions. Hosted backend
provisioning and app-store approval are outside the client workflow.

## Requirements

- Enable native startup recovery in the binary and create one optional client.
- Publish, check and stage compatible production JavaScript and assets.
- Activate on cold launch and confirm essential app startup.
- Recover failed startup and manual rollback while retaining app data.
- Recognize unsupported targets and remaining distribution qualifications.

## Acceptance criteria

- AC1: The reader can enable the boot hook, rebuild the binary, configure the endpoint and versions, and identify custom native startup configurations that require integration.
- AC2: The reader can publish a production app archive, check its channel, stage verified bytes, and reject corruption, unsafe paths and a higher minimum native version before activation.
- AC3: The current session remains unchanged after staging; the next cold launch runs the new code, and the reader confirms startup only when essential UI/data are ready.
- AC4: An update that fails before confirmation restores a working backup on the following launch; explicit rollback restores the backup or embedded app, retains user data, and rejects the bad hash.
- AC5: The reader can distinguish native release support from debug/LiveSync, browser and desktop behavior, and identify unsigned simulator evidence, hosted deployment and signing gaps.

## Documentation

- AC1: [Binary setup](../docs/app/updates.md#set-up-the-binary-once), [client configuration](../docs/app/updates.md#create-one-client), and [prepare hook checks](../packages/updates/tests/prepare.test.mjs).
- AC2: [Check and install](../docs/app/updates.md#check-and-install), [publish and validate](../docs/app/updates.md#publish-and-validate), and [client failure coverage](../packages/updates/tests/client.test.mjs).
- AC3: [Startup confirmation](../docs/app/updates.md#create-one-client), [state inspection](../docs/app/updates.md#check-and-install), the [startup helper](../examples/updates/startup.mobile.ts), and [release lifecycle regression](../packages/updates/tests/native-lifecycle.mjs).
- AC4: [Recover a release](../docs/app/updates.md#recover-a-release), [native guard regression](../packages/updates/tests/native-guard.test.mjs), and [release lifecycle regression](../packages/updates/tests/native-lifecycle.mjs).
- AC5: [Scope and qualification](../docs/app/updates.md), [integrity and other targets](../docs/app/updates.md#integrity-and-other-targets), and [packed declarations](../packages/updates/tests/packed-consumer.mjs).
