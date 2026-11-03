# Lint and format app source

ID: source-quality
Targets: web, ios, android, macos
Related APIs: xplat lint, xplat lint --fix, xplat fmt, xplat-lint, @octane-xplat/lint, .oxlintrc.json

## Starting point

An app or component library has the Xplat CLI installed with Bun >=1.4.4
available, or uses a standalone executable with Bun embedded. The reader runs
commands from the project directory. These are host-side code checks; they
do not establish runtime behavior on a browser or device.

The experimental Nim executable has a separate, partial migration path: native
lint requires Node and a project-installed `@octane-xplat/lint`; native formatting
is pending. This does not satisfy AC1's CLI-only installation or the native part
of AC5. Keep those gaps explicit rather than treating the smaller download as
full workflow coverage. See the [native CLI setup](../../../docs/packages/package-cli.md#experimental-nim-executable)
and [packed-engine qualification](../../../tools/cli-nim/lint-command.test.mjs).

## Requirements

- Check shared source without assembling a separate lint toolchain.
- Apply supported fixes and recognize findings that still need manual edits.
- Check selected files with consistent ignore behavior across source formats.
- Customize rules while retaining the framework defaults when desired.

## Acceptance criteria

- AC1: With the documented CLI runtime available, a project with only the CLI installed can lint regular source and TSRX without a lint config or direct Oxlint dependency; the reader can identify the rule coverage of each pass.
- AC2: Linting leaves source unchanged by default; safe fixes are opt-in, remaining errors fail the command, and warnings remain advisory.
- AC3: Files and directories select the same scope in both passes, with matching Git/config ignores and consistent output-directory, symlink and nested-repository boundaries.
- AC4: The reader can use a strict JSON project config, extend the bundled preset, and override Xplat rule severities/options for matching files; unsupported config formats and invocation-root scope are explicit.
- AC5: The reader can format source separately and check formatting without writes; app and library starters expose the supported lint and formatting scripts.
- AC6: Existing standalone xplat-lint invocations remain usable with paths and safe fixes, including direct Node invocation without bin shims on PATH.

## Documentation

- AC1: [CLI runtime and standalone executable](../../../docs/packages/package-cli.md#single-file-executable), [Lint and format source](../../../docs/testing/testing.md#lint-and-format-source), [rule coverage](../../../docs/packages/package-lint.md#what-gets-checked), and the [CLI integration tests](../../../packages/cli/test/lint.test.mjs).
- AC2: [Lint behavior and exit codes](../../../docs/packages/package-cli.md#lint-and-format), [fixes](../../../docs/testing/testing.md#lint-and-format-source), and the [CLI integration tests](../../../packages/cli/test/lint.test.mjs).
- AC3: [Selection and ignores](../../../docs/packages/package-lint.md#what-gets-checked) and the [selection, ignore and boundary tests](../../../packages/cli/test/lint.test.mjs).
- AC4: [Project configuration](../../../docs/packages/package-lint.md#project-configuration) and the [configuration parity tests](../../../packages/cli/test/lint.test.mjs).
- AC5: [Separate lint and format commands](../../../docs/testing/testing.md#lint-and-format-source), [app scripts](../../../packages/create/template/package.json), [library scripts](../../../packages/create/library-template/package.json), and the [format command tests](../../../packages/cli/test/fmt.test.mjs).
- AC6: [Standalone command and direct Node example](../../../docs/packages/package-lint.md) and the [compatibility integration test](../../../packages/cli/test/lint.test.mjs).
