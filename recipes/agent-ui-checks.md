# Check stable controls with an optional coding-agent tool

ID: agent-ui-checks
Targets: web, ios, android
Related APIs: testID, Argent 0.27.0 CLI and MCP

## Starting point

A buildable local Xplat app and dedicated browser, simulator, or emulator.
The reader wants reliable targets independent of translated spoken labels.

## Requirements

Use optional semantic test names, preserve accessibility semantics, and
exercise a bounded journey with honest platform qualification. No app runtime
Argent dependency is required.

## Acceptance criteria

- AC1: Assign stable, unique semantic names to meaningful controls and repeated items without changing existing IDs or spoken labels/roles.
- AC2: Identify the interactive host, supported forwarding scope, native mapping, and Chromium DOM-id precedence without implying desktop or blanket composite support.
- AC3: Set up optional pinned Argent tooling, distinguish discovery from replay prerequisites, and execute local numeric input/actions and overlays without visual capture.
- AC4: Keep maintained regressions for identity changes/removal and parent/child/overlay lifecycle; report actual target evidence separately from unsupported journeys.

## Documentation

- AC1: [Semantic names](../docs/verify/test-identifiers.md#give-controls-stable-test-names), [starter guidance](../packages/create/template/AGENTS.md#stable-automation-targets)
- AC2: [Host forwarding](../docs/verify/test-identifiers.md#which-host-receives-the-name), [platform mapping](../docs/verify/test-identifiers.md#platform-mapping-and-selector-precedence)
- AC3: [Local journey](../docs/verify/argent.md#start-with-a-local-journey), [services](../docs/verify/argent.md#discovery-and-replay-need-different-services)
- AC4: [Maintained checks and scope](../docs/verify/argent.md#maintained-checks-and-scope), [fixture](../packages/ui/tests/fixtures/TestID.tsrx)
