# Qualify a consumer app through development MCP

ID: mcp-consumer-workflow
Targets: web
Related APIs: xplat_project_status, xplat_docs_search, xplat_docs_read, xplat_launch, xplat_inspect, xplat_interact, xplat_dev_actions, xplat_session_end

## Starting point

A framework checkout with the MCP package, an independently
scaffolded consumer, and a dedicated Chromium process. Two maintained lanes
exist: the linked-checkout in-memory lane and the packed-artifact stdio lane
(packed tarballs, release-tag fixture, installed `xplat-mcp` bin). This
recipe covers the incremental Chromium lane; the full MCP initiative still
requires all six platforms and does not close when this recipe passes.

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

- AC1: [Bound documentation](../../../packages/mcp/README.md#retrieve-the-apps-documentation), [consumer lane](../../../packages/mcp/README.md#run-the-consumer-acceptance-lane)
- AC2: [Runtime lifecycle](../../../packages/mcp/README.md#runtime-work-item-d), [bounded inspection](../../../packages/mcp/README.md#inspect-and-interact-with-chromium)
- AC3: [Input mechanisms](../../../packages/mcp/README.md#inspect-and-interact-with-chromium), [OS journey](../../../packages/mcp/README.md#run-the-consumer-acceptance-lane)
- AC4: [Declare, invoke, and assert an action](../../../docs/testing/development-actions.md), [agent authoring guidance](../../skills/octane-xplat/references/development-actions.md), [app declaration and acceptance](../../../packages/mcp/README.md#run-the-consumer-acceptance-lane), [maintained runners](../../../packages/mcp/tests/consumer-workflow.mjs)
- AC5: [Capture gate](../../../packages/mcp/README.md#inspect-and-interact-with-chromium), [cleanup](../../../packages/mcp/README.md#runtime-work-item-d)
- AC6: [Remaining acceptance](../../../packages/mcp/README.md#remaining-acceptance)

The packed-stdio lane ([prepare](../../../packages/mcp/tests/prepare-packed-consumer.mjs), [runner](../../../packages/mcp/tests/packed-stdio-consumer.mjs)) exercises the same criteria against packed tarballs over stdin/stdout.

The `xplat` CLI projects the same services through agent commands; the packed
agent lane ([runner](../../../packages/cli/test/packed-agent-consumer.mjs)) verifies
the discovery/retrieval subset plus the web session journey — build, launch,
session readiness/build-job polling, diagnostics, inspect, dom-event and os-input interaction,
capture gating, dev-action discovery/invocation, and ownership-safe cleanup —
through the installed `xplat` bin and its per-workspace runtime host.
The [agent CLI skill guide](../../skills/octane-xplat/references/cli.md) teaches
that path using installed help/schema for command details: selection and
version-bound retrieval (AC1), jobs/readiness/logs (AC2), inspection and state
assertions (AC3), declared actions (AC4), and evidence/ownership-safe cleanup
(AC5). It preserves the capability and evidence boundaries in AC6 rather than
claiming these instructions qualify additional targets.
Session ACs on the five non-web targets remain MCP-covered; the agent lane
asserts honest `unsupported_capability`/prerequisite errors rather than a
full-device qualification.

Read diagnostic log pages from `data.logs` (`logs.nextCursor` for continuation).
The `xplat_diagnostics` tool and CLI command also expose retained
session reports; build-job selectors explicitly disclose native lookup as
unavailable. See [development diagnostics](../../../docs/testing/diagnostics.md).

Owned launches return one durable session ID; readiness is polled through session status rather than a launch job. CLI start selects an optional exact target or platform positional; MCP uses the optional `target` field.
