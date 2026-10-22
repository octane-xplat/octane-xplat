# Run and extend the starter's automated tests

ID: app-testing
Targets: web, ios, android
Related APIs: create-octane-xplat, xplat add, test:web, test:ios, test:android, catalog:xplat

## Starting point

An app created for web, iOS, or Android. Its initial install contains the
runtime/build packages and test setup for its selected platforms; the developer
wants to run the samples and add checks. Library publishing checks are a
separate workflow.

## Requirements

Explain default test setup, selected-platform scripts,
sample-test conventions, preservation of app edits, and what each environment
can verify. Keep unused feature dependencies out of default apps.

## Acceptance criteria

- AC1: Creating an app includes framework-managed test dependencies, files, and scripts for enabled platforms while omitting unused feature plugins and other platforms' test tooling.
- AC2: A web app runs the sample counter interaction with `pnpm test:web`; docs explain the file convention and distinguish jsdom checks from browser layout and real input.
- AC3: Adding a platform preserves user test scripts, files, and dependency specifications and reports conflicts; adding an enabled platform again leaves them unchanged. In a monorepo, missing catalog pins and patch configuration belong to the enclosing workspace, preserving its existing settings without creating a child workspace.
- AC4: Adding a platform supplies its test setup while preserving existing tests; phone commands select an explicit device and link to platform qualification limits.

## Documentation

- AC1: [Starter tests](../../../packages/create/README.md#run-app-tests), [target-specific checks](../../../packages/create/test/scaffold.test.mjs)
- AC2: [Run web tests](../../../docs/testing/testing.md#add-automated-tests), [sample test](../../../packages/create/template/src/app.web.test.tsx)
- AC3: [Creation and preservation](../../../packages/cli/README.md#app-testing), [setup checks](../../../packages/create/test/scaffold.test.mjs), [workspace boundary checks](../../../packages/cli/test/audit-cli-boundaries.test.mjs)
- AC4: [Later platforms](../../../packages/cli/README.md#app-testing), [phone tests and limits](../../../docs/testing/testing.md#test-components-on-a-device)
