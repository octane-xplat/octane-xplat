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

`routes` uses that boundary: the selected project's `@octane-xplat/cli/worker`
parses source, runs baked loaders through its Vite installation, and renders the
canonical 18-artifact plan. Go validates the complete destination set, checks raw
input/output bytes for concurrent edits, and stages adjacent files before native
rename. Unchanged files keep their timestamps; changed existing files retain
their permissions. Each rename is atomic; the complete set is not a transaction.
An interrupted publication reports partial effects and any retained staging.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go route workflow"}' -- bun run turbo run test:go-routes --filter=@octane-xplat/cli
# From an application directory with its CLI worker and Vite installed:
/absolute/path/to/xplat-go routes --dir app --out routes.gen
/absolute/path/to/xplat-go routes --watch
```

Watch uses a bounded 500 ms poll with one active generation. Changes cancel and
await the old worker before starting another; stale results cannot publish.
The generated output path stays fixed until watch restarts. Fingerprints cover
the route tree, configured source references and common project configuration,
not arbitrary files read by user JavaScript. Worker diagnostics are bounded and
printed after completion. Route traversal rejects cycles and bounds entries,
depth and text bytes. Authorized external route/output directories are supported;
an output alias cannot overwrite route inputs or leave its authorized output scope.

`typecheck` prepares those route contracts without executing baked loaders or
replacing existing baked data. The selected project's worker reuses canonical
JSONC/environment expansion, including its disposable combined-program cache.
Go validates program selection and starts the installed
`@tsrx/typescript-plugin` checker with Node. Missing tools produce installation
instructions; Go does not invoke a package manager to download them.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go typecheck workflow"}' -- bun run turbo run test:go-typecheck --filter=@octane-xplat/cli
# From a project with its CLI worker, TSRX checker and TypeScript installed:
/absolute/path/to/xplat-go typecheck
```

Each program prints a heading and inherits stdout/stderr directly, preserving
live compiler diagnostics without buffering them into a worker response. The
same native process group/job owns cancellation and descendant cleanup. Compiler
runs have the command's cancellation context; the short configuration worker
has a two-minute deadline. Programs run in reference order and stop on the first
failure. An empty project with no routes or programs needs no Node worker.

`fmt` reuses canonical Node discovery, Git ignores and the selected project's
`@octane-xplat/fmt` engine. Go validates all returned source identities and scopes
before writing, then publishes each changed file beside its target, preserving
permissions and unchanged timestamps. Writes across files are not a transaction;
failures disclose partial publication. `--check` exits 1 for differences; usage,
configuration, transformation and I/O errors exit 2. Stdin mode writes only the
formatted text to stdout; worker/library diagnostics go to stderr.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go formatter workflow"}' -- bun run turbo run test:go-fmt --filter=@octane-xplat/cli
# From a project with its CLI worker and formatter installed:
/absolute/path/to/xplat-go fmt src tests
/absolute/path/to/xplat-go fmt --check
/absolute/path/to/xplat-go fmt --stdin-filepath src/example.ts < src/example.ts
```

`lint` invokes the selected project's `@octane-xplat/lint/bin` export with Node.
The installed engine owns configuration, discovery, companion TSRX checks and
explicit `--fix` writes. Go preserves raw arguments, live stdout/stderr and the
engine's exit code while owning cancellation and descendant cleanup. No additional
CLI worker or global tool installation is used for this operation.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go lint workflow"}' -- bun run turbo run test:go-lint --filter=@octane-xplat/cli
# From a project with its lint engine installed:
/absolute/path/to/xplat-go lint src
/absolute/path/to/xplat-go lint --fix src
```

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

The documentation snapshot service pins exact release tags and package metadata
under a separate `go-v1` cache. It extracts bounded Markdown blobs without a Git
checkout, validates cached raw bytes before reuse, and reports offline reads,
moved/deleted tags and corrupt caches explicitly. An owned native compute child
contains binding, Git work and retrieval. Public read/search use this boundary.
Ordinary search and page reads do not download optional model/runtime assets.
Project Markdown guidance is returned separately from release results.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go documentation snapshots"}' -- bun run turbo run test:go-doc-snapshot --filter=@octane-xplat/cli
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go documentation commands"}' -- bun run turbo run test:go-docs --filter=@octane-xplat/cli
research/go-cli/xplat-go-darwin-arm64-cli docs search dictation --project . --app apps/web --package @octane-xplat/ui --mode exact --json
research/go-cli/xplat-go-darwin-arm64-cli docs read --project . --app apps/web --package @octane-xplat/ui --path docs/app/components.md --json
```

The inference-enabled entry supports explicit index preparation and native hybrid
retrieval. Index preparation downloads checksum-pinned MiniLM and ONNX Runtime
assets into the private cache. On macOS arm64 those first-use downloads total
60,621,482 bytes, separate from the executable. The core entry omits this optional
feature. Missing or invalid assets/index data produce a labeled lexical fallback
during search; preparing the index explicitly repairs invalid cached vectors.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go native documentation index"}' -- bun run turbo run test:go-doc-index --filter=@octane-xplat/cli
research/go-cli/xplat-go-darwin-arm64-cli-onnx docs index --project . --app apps/web --package @octane-xplat/ui --json
research/go-cli/xplat-go-darwin-arm64-cli-onnx docs search dictation --project . --app apps/web --package @octane-xplat/ui --mode hybrid --json
```

Completed vector batches survive cancellation. Model, runtime, inference settings
and tokenizer dependencies contribute to cache identity; fresh document inventory
keeps edited or deleted content from returning stale hits. The compute child
reuses one native model session per operation. Large fenced sections keep their
full text for lexical search and reads; model previews are bounded to 64 KiB,
with `truncatedInputs` reported alongside the model's 512-token context limit.
The prototype RPC owner can run
and cancel this work while responding to other requests; public CLI integration
with the persistent owner remains migration work. Direct CLI process ownership
and prototype RPC qualification are separate from that pending integration.
