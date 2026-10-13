# Qualify a consumer app through development MCP

ID: mcp-consumer-workflow
Targets: web
Related APIs: xplat_project_status, xplat_docs_search, xplat_docs_read, xplat_launch, xplat_inspect, xplat_interact, xplat_dev_actions, xplat_session_end

## Starting point

A framework checkout with the private MCP package installed, an independently
scaffolded consumer, and a dedicated Chromium process. This recipe covers the
incremental Chromium lane; the full MCP initiative still requires all six
platforms and does not close when this recipe passes.

## Requirements

Use the selected app's actual version binding, stable named controls and
session/document identities. Distinguish browser events from genuine OS input.
Keep screenshots gated, production artifacts free of fixture handlers, and
cleanup restricted to owned resources.

## Acceptance criteria

- AC1: Connect, select the app explicitly when ambiguous, retrieve version-bound docs and current code, and report unavailable matching docs without latest fallback.
- AC2: Build and launch the independent consumer with separate readiness and job evidence; inspect bounded named host state and disclose incomplete coverage.
- AC3: Exercise a stable counter control and assert its resulting state; report browser-event and OS-input journeys separately with document/session/build identity.
- AC4: Automatically discover and invoke an app-declared action, validate its result, separately assert app state, and exclude its declaration and handler from production artifacts.
- AC5: Refuse capture without current visual approval, release owned browser/server/profile resources, reject stopped identities, and preserve attached user-owned sessions.
- AC6: Report the mandatory remaining native targets, attached inspection and approved screenshot qualification; a Chromium pass cannot satisfy full six-platform acceptance.

## Documentation

- AC1: [Bound documentation](../packages/mcp/README.md#retrieve-the-apps-documentation), [consumer lane](../packages/mcp/README.md#run-the-consumer-acceptance-lane)
- AC2: [Runtime lifecycle](../packages/mcp/README.md#runtime-work-item-d), [bounded inspection](../packages/mcp/README.md#inspect-and-interact-with-chromium)
- AC3: [Input mechanisms](../packages/mcp/README.md#inspect-and-interact-with-chromium), [OS journey](../packages/mcp/README.md#run-the-consumer-acceptance-lane)
- AC4: [App declaration and acceptance](../packages/mcp/README.md#run-the-consumer-acceptance-lane), [maintained runner](../packages/mcp/tests/consumer-workflow.mjs)
- AC5: [Capture gate](../packages/mcp/README.md#inspect-and-interact-with-chromium), [cleanup](../packages/mcp/README.md#runtime-work-item-d)
- AC6: [Remaining acceptance](../packages/mcp/README.md#remaining-acceptance)
