# Run and extend the starter's automated tests

ID: app-testing
Targets: web, ios, android
Related APIs: create-octane-xplat, xplat add testing, xplat.features.testing, test:web, test:ios, test:android, catalog:xplat

## Starting point

An app created for web, iOS, or Android. Its initial install contains the
runtime/build packages and test setup for its selected platforms; the developer
wants to run the samples and add checks. Library publishing checks are a
separate workflow.

## Requirements

Explain default test setup, migration for older apps, selected-platform scripts,
sample-test conventions, preservation of app edits, and what each environment
can verify. Keep unused feature dependencies out of default apps.

## Acceptance criteria

- AC1: Creating an app includes framework-managed test dependencies, files, and scripts for enabled platforms while omitting unused feature plugins and other platforms' test tooling.
- AC2: A web app runs the sample counter interaction with `pnpm test:web`; docs explain the file convention and distinguish jsdom checks from browser layout and real input.
- AC3: Default creation and later `xplat add testing` in an older app produce equivalent setup; repeating setup preserves user scripts, files, and dependency specifications and reports conflicts.
- AC4: After testing is enabled, adding a platform supplies its test setup while preserving existing tests; phone commands select an explicit device and link to platform qualification limits.

## Documentation

- AC1: [Starter tests](../../../packages/create/README.md#run-app-tests), [target-specific checks](../../../packages/create/test/scaffold.test.mjs)
- AC2: [Run web tests](../../../docs/verify/testing.md#add-automated-tests), [sample test](../../../packages/create/testing-template/web/src/app.web.test.tsx)
- AC3: [Creation and preservation](../../../packages/cli/README.md#app-testing), [setup checks](../../../packages/create/test/scaffold.test.mjs)
- AC4: [Later platforms](../../../packages/cli/README.md#app-testing), [phone tests and limits](../../../docs/verify/testing.md#test-components-on-a-device)
