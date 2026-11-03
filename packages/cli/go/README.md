# Parallel Go CLI

This directory owns the Go migration of `xplat`. The TypeScript implementation
is the behavioral reference; [Nim](../nim/README.md) remains available until the
replacement is ready. The production bin and publication workflow are unchanged.
The native executable never calls the old CLI as a fallback.

Build the public entry and run contract tests through Turbo. Use the repository's
Bun 1.4.4 and Go 1.27.3. Node is a prerequisite for explicit JavaScript workers;
Go does not bundle, download, or manage a Node installation.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go CLI build and contracts"}' -- bun run turbo run test:go-cli --filter=@octane-xplat/cli
research/go-cli/xplat-go-darwin-arm64-cli catalog --json
research/go-cli/xplat-go-darwin-arm64-cli status --project . --app apps/web --json
research/go-cli/xplat-go-darwin-arm64-cli capabilities --project . --app apps/web --json
```

The catalog and schemas report execution coverage for this build. Pending
operations fail explicitly. A schema, parser or primitive probe is never evidence
that the corresponding command or platform provider is implemented. Current
migration status and qualification evidence live in Silo and local reports.

`entry_cli.go` is the public entry; the `probe` build tag selects the retained
primitive harness instead. Both use the same process, HTTP, worker and native
model code. The [evaluation tooling](../../../tools/cli-go/README.md) owns compiler
pins, source/artifact fingerprints, measurements, project fixtures and portable
qualification snapshots. Generated command metadata comes from the actual
TypeScript descriptors at build time; help and schemas need no runtime Node.

`cli_contract.go` handles descriptor parsing, errors and exit groups. `workspace.go`
keeps explicit selection and client preferences separate from sole-app discovery;
read-only discovery does not persist a selection. `policy.go` reports grants
without granting visual capture, retention or external effects. Workspace cache
writes use Go's directory-root API rather than a check followed by an unbounded
path operation. Host/request secrets still require separate private permissions
and Windows ownership/DACLs.

Package binding reads the selected app's installed manifests before lockfile
versions, and reports installation/lockfile conflicts. Ordinary workspace
patterns such as `apps/*`, literal paths, and leading `!` exclusions are matched
natively. Advanced glob expressions are rejected with an instruction to simplify
the workspace configuration; workspace matching does not start a Node worker.

Native project guidance uses the same installed-package identity as source
retrieval. It labels linked checkouts and installation/lockfile conflicts, and
describes the providers available in this Go build. Guidance does not download
assets or prepare documentation snapshots.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go package binding verification"}' -- bun run turbo run test:go-binding --filter=@octane-xplat/cli
research/go-cli/xplat-go-darwin-arm64-cli guidance --project . --app apps/web --json
```

Inference remains native. Optional ONNX/model assets and project compiler engines
have separate costs from the executable. Keep project Vite plugins and small
workers in `@octane-xplat/cli`; language boundaries do not require package splits.
Go owns argv, cwd, environment, timeouts, publication, sessions, logs, cancellation
and cleanup. Use small workers for operations requiring the project's JavaScript
compiler, plugin or configuration execution, never a general CLI fallback.

Source search/read keeps app files separate from installed framework packages and
labels checkout content as development source. Intent search builds a bounded
local identifier/TF-IDF index in Go; exact search reads current files. Reads check
both an alias name and its canonical target, reject private/generated/binary
content and return a continuation offset for larger files. Search results are
leads to open before changing code.

```sh
research/go-cli/xplat-go-darwin-arm64-cli code search Button --project . --app apps/web --mode exact --corpus framework --package @octane-xplat/ui --json
research/go-cli/xplat-go-darwin-arm64-cli code read --project . --app apps/web --ref xplat-code://framework/@octane-xplat/ui/chat/ChatDictationButton.tsrx --json
```
