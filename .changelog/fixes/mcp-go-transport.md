### xplat-mcp runs on the Go agent commands

`@octane-xplat/mcp` is a thin stdio transport again after the Go CLI cutover:
its tools call `xplat ... --json` for sessions, targets, diagnostics,
inspection, dev-actions and evidence — one implementation, two transports.
The contract modules moved back into the package; workspace selection,
permission grants and client elicitation stay server-side.

**Contract boundary:** the Go agent contract has no owned launch, build job,
session end, generic job cancel, or capture command. `xplat_launch`,
`xplat_build`, `xplat_session_end`, `xplat_job_cancel` and `xplat_screenshot`
keep their names and permission gates but report `unsupported_capability`/
`unavailable` with the supported path — run `xplat dev`, connect the app, and
use `xplat_attach`. `xplat_interact` now dispatches `handler-dispatch` only.
