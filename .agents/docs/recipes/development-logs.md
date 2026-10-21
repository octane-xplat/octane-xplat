# Read development diagnostics

ID: development-logs
Targets: web, ios, android, macos, linux, windows
Related APIs: xplat dev, xplat diagnostics, xplatDevBridge

## Starting point

A consumer app with the installed CLI and a configured development target.
An agent may connect after an error or after the development process exits.

## Requirements

Capture output from startup without requiring an agent session. Preserve the
terminal output and user-owned process lifetimes. State capture coverage and
retention gaps; process output is not a complete OS diagnostic stream.

## Acceptance criteria

- AC1: Start a target with xplat dev; retrieve stdout, stderr, and a final partial line after its capture owner exits.
- AC2: Discover runs by selected app/platform, read an exact run, continue with its cursor, and reject foreign runs or conflicting selectors without spawning an agent host.
- AC3: Bound disk and pending-line memory, retain active captures, evict completed history, and disclose eviction, truncated lines, and incomplete file tails.
- AC4: Forward browser warnings/errors through the authenticated dev bridge before agent connection, preserve default reporting, omit object payloads, and exclude hooks/endpoints from production.
- AC5: Report source/subprocess tests separately from browser, simulator, emulator, physical-device, and native-host runs; document the sources that remain unavailable.

- AC6: Discover existing app/run-scoped native reports with explicit availability and candidate/confirmed association; preserve complete originals separately from log rotation, with bounded retention and no OS report deletion.
- AC7: Use diagnostics across CLI/MCP run/session/job selection; remove the former logs command/tool, and keep log cursors separate from report reads.

## Documentation

- AC1: [Start capture and read a run](../../../docs/testing/diagnostics.md), [subprocess regression](../../../packages/cli/test/dev-logs.test.mjs)
- AC2: [Run selection and pagination](../../../docs/testing/diagnostics.md), [agent guidance](../../skills/octane-xplat/references/cli.md#follow-jobs-and-sessions-through-completion), [CLI regression](../../../packages/cli/test/agent-cli.test.mjs)
- AC3: [Retention and missing evidence](../../../docs/testing/diagnostics.md#retention-and-missing-evidence), [storage regression](../../../packages/cli/test/dev-logs.test.mjs)
- AC4: [Browser setup and boundaries](../../../docs/testing/diagnostics.md#what-is-captured), [client regression](../../../packages/cli/test/dev-browser-logs.test.mjs), [HTTP regression](../../../packages/cli/test/dev-bridge.test.mjs), [optional Chromium qualification](../../../packages/cli/test/verify-dev-logs-browser.mjs)
- AC5: [Platform coverage](../../../docs/testing/diagnostics.md#what-is-captured), [evidence record](../../design/agent-diagnostics.md)

- AC6: [Native report sources and limits](../../../docs/testing/diagnostics.md#native-reports), [collector regression](../../../packages/cli/test/native-reports.test.mjs)
- AC7: [Diagnostic interface](../../../docs/testing/diagnostics.md), [CLI regression](../../../packages/cli/test/agent-cli.test.mjs), [MCP regression](../../../packages/mcp/tests/server.test.mjs)
