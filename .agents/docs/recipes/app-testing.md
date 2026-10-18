# Add automated tests to a minimal app starter

ID: app-testing
Targets: web, ios, android
Related APIs: create-octane-xplat, --testing, xplat add testing, xplat.features.testing, test:web, test:ios, test:android, catalog:xplat

## Starting point

An app created for web, iOS, or Android. Its initial install contains the
runtime/build packages for its selected platforms; the developer wants to add
repeatable checks when needed. Library publishing checks are a separate workflow.

## Requirements

Explain the one-command setup and creation option, selected-platform scripts,
sample-test conventions, preservation of app edits, and what each environment
can verify. Keep optional test and feature dependencies out of default apps.

## Acceptance criteria

- AC1: Creating an app omits optional feature plugins and test tooling; adding testing supplies only the test dependencies, files, and scripts needed by enabled platforms.
- AC2: A web app runs the sample counter interaction with `pnpm test:web`; docs explain the file convention and distinguish jsdom checks from browser layout and real input.
- AC3: Creation with `--testing` and later `xplat add testing` produce equivalent setup; repeating setup preserves user scripts, files, and dependency specifications and reports conflicts.
- AC4: After testing is enabled, adding a platform supplies its test setup while preserving existing tests; phone commands select an explicit device and link to platform qualification limits.

## Documentation

- AC1: [Minimal starter and setup](../../../packages/create/README.md#add-app-tests), [target-specific checks](../../../packages/create/test/scaffold.test.mjs)
- AC2: [Run web tests](../../../docs/verify/testing.md#add-automated-tests), [sample test](../../../packages/create/testing-template/web/src/app.web.test.tsx)
- AC3: [Creation and preservation](../../../packages/cli/README.md#add-app-testing), [setup checks](../../../packages/create/test/scaffold.test.mjs)
- AC4: [Later platforms](../../../packages/cli/README.md#add-app-testing), [phone tests and limits](../../../docs/verify/testing.md#test-components-on-a-device)
