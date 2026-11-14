# MCP consumer verification

Use this runbook when changing MCP session, inspection, input or packaging
contracts. The [consumer recipe](recipes/mcp-consumer-workflow.md) owns acceptance
criteria; Silo owns run status and platform gaps. Reserve shared build and desktop
resources as shown, and follow current visual-analysis and device rules.

## Run the consumer acceptance lane

Use a fresh directory outside your existing app. These commands scaffold the
normal web starter and add one app-owned development action. The in-repo lane
links framework packages to this checkout; other dependencies
install normally. The runner checks docs and current code, build/readiness,
the counter's `0 → 1` transition, action discovery/invocation, screenshot
denial, logs, and owned browser/server/profile cleanup. It also checks that
the fixture declaration and handler are absent from production artifacts.

```sh
node packages/mcp/tests/prepare-consumer.mts /tmp/new-xplat-mcp-app
bun run --cwd /tmp/new-xplat-mcp-app install
node packages/mcp/tests/consumer-workflow.mts /tmp/new-xplat-mcp-app
```

The default run supplies browser-event evidence. On macOS, reserve the full
resource set and add `--os-input` for a headed Chromium OS keyboard journey.
Only the owned browser receives the events; the helper attempts to restore the
previously active application and reports when restoration is unconfirmed.
The runner captures no images.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1,"desktop_input":1},"purpose":"MCP consumer OS keyboard acceptance"}' -- node packages/mcp/tests/consumer-workflow.mts /tmp/new-xplat-mcp-app --os-input
```

The packed-artifact lane qualifies the same checks against release-evidence
packaging: `prepare-packed-consumer.mts` packs the needed packages, scaffolds
through the packed `create-octane-xplat` bin, installs `file:` tarballs (no
registry/latest resolution for framework packages), and tags the framework
HEAD as `v<installed version>` in a local bare release fixture. The runner
spawns the consumer's own installed `xplat-mcp` bin over stdin/stdout and
redirects the canonical release-repo URL to the fixture through a per-process
`url.insteadOf` (never user git config). Snapshot cache and evidence roots are
isolated under the work dir. OS keyboard input additionally requires an
unlocked console — the window server refuses activation while the screen is
locked, and the run reports that block honestly.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1,"desktop_input":1},"purpose":"packed MCP stdio consumer acceptance"}' -- bash -c '
  node packages/mcp/tests/prepare-packed-consumer.mts /tmp/xplat-packed-mcp &&
  node packages/mcp/tests/packed-stdio-consumer.mts /tmp/xplat-packed-mcp'
```
