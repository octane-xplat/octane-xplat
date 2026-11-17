# Platform TypeScript programs

`packages/cli/src/tsconfig-envs.ts` owns environment expansion. A manifest's
`web`, `ios`, `android`, `macos`, `windows`, and `gtk` entries produce separate programs.
`native` is a shorthand for two programs, never a merged phone SDK. Do not declare
`native` together with `ios` or `android`. Native Linux uses the `gtk`
program with the existing GJS host declarations, `.gtk` → unsuffixed resolution,
and `gtk`/`native` export conditions, without DOM libraries. The retired `linux`
manifest environment is rejected; move its native roots into `gtk`. Existing
`.linux` service barrels may remain explicitly listed GTK roots, but `.linux`
is not a UI resolution tier. These programs do not restore desktop WebView hosts.
An app-owned document inside an embedded WebView belongs in a separate `web`
program; its browser declarations must not enter the native host graph.

Each isolated program uses its target's module suffixes and export conditions.
Shared files included by the manifest or reached through imports are checked in
every applicable program. Foreign tagged roots and defaults shadowed by an active
leaf are omitted; explicit imports still enter the transitive graph. Do not use
root filtering to claim that an imported file was excluded. TypeScript 7.1's
registered-extension suffix limitation still applies to `.tsrx`: explicit
`./Card.tsrx` imports bind the unsuffixed contract, and leaf files are checked as
roots. Builds retain their existing TSRX runtime selection.

`lib` and `types` are set explicitly per program, overriding inherited mixed
settings and disabling automatic `@types` discovery. An existing
`@nativescript/types` request selects `globals.d.ts` and the matching phone SDK;
it does not load the umbrella index, which references both SDKs. Resolve those
files from the declared umbrella dependency so Bun's isolated linker does not
require consumers to add undeclared direct dependencies. Preserve existing
module-scoped SDK APIs on main. macOS uses its existing AppKit/Node host declarations;
Windows keeps the existing module-scoped WinRT surface and narrow JS globals.
This work does not strengthen the WinRT surface's existing `any` types. GTK
introspection declarations remain module-scoped; include the existing
`@octane-xplat/linux-gtk/gi` declarations in the GTK entry when importing `gi://`
modules. Their hand-maintained subset and `any` fallbacks are not a complete SDK check.

Both checking runners inspect `tsc --listFilesOnly` before checking. Generated
negative assertions also catch foreign globals from renamed or custom ambient
declarations. A transitive
DOM library in a non-web program, foreign phone SDK, or umbrella SDK index fails
even with `skipLibCheck`. This matters for generated public declarations and
triple-slash references, which bypass `compilerOptions.types`. Keep declaration
emission (`tsconfig.types.json`) distinct from environment validation; an emit
check alone does not establish isolation. Top-level DOM libraries are rejected
when isolated native environments are present; move them to `environments.web.compilerOptions.lib`.
Do not fix a reported leak by adding a global shim or suppressing the guard.
The guards cover DOM and phone SDK boundaries. Imported test tools can still
contribute Node declarations; review those capabilities separately. `types: []`
prevents automatic discovery, while explicit transitive references still load.
Ordinary and declaration-emission tasks without a manifest retain their existing
contracts and do not qualify isolated checking.

## Discoverable editor projects

A source file's nearest `tsconfig.json` must reference the generated programs.
The generated cache files alone are not discoverable editor configuration.
Repository environment workspaces and new starters carry solution references;
run their typecheck to prepare those referenced files after installation and
whenever manifest roots change. `xplat typecheck` retains the root config check and also checks the manifest
programs independently. A solution root contains no source files of its own;
a mixed legacy root is an additional check and does not qualify isolation. Existing apps need to
replace broad root `include`/`files` with solution references, retaining shared
options in the manifest or its base. See the [public setup](../../docs/platform/module-resolution.md#editor-project-context).

TypeScript 7's native LSP (`tsc --lsp --stdio`) and the actual
`@octane-xplat/cli` TSRX mapper are exercised by
`packages/cli/test/platform-programs.test.mts`. The fixture uses real phone SDKs,
checks transitive declaration lists, opens TS and TSRX leaves without naming
projects, and verifies target-specific hover and diagnostics. It also introduces
errors in shared TS/TSRX files and checks all six compiler programs. The OXC
TSRX server is a parser/linter; it does not establish semantic TypeScript support.

A shared file can belong to several programs. An editor request normally uses
one default project, so its diagnostics and completion reflect that context.
Reference ordering is not a portable platform picker. Do not claim a platform
selection UI or simultaneous diagnostics from all programs. For deliberate shared
file work, temporarily reference only the chosen program in the solution, reload
the language server, and restore all references before working on other leaves.
Keep all other root options when editing references. The CLI still checks every manifest environment. The fixture verifies this
single-reference context selection for TS and TSRX.

LSP tests establish language-service behavior, not VS Code extension activation,
editor settings, displayed diagnostics, device behavior, or platform rendering.
Use the [TSRX editor setup](https://github.com/tsrx-org/tsrx/blob/main/packages/vscode-plugin/README.md#native-backend-setup)
for the installed editor integration; the repository pins TypeScript 7.1.0-beta
and content mapper 0.1.2. Starters declare TypeScript directly for editor
discovery under Bun's isolated linker. Recheck project discovery and mapper diagnostics on
compiler upgrades. No runtime import adapters or import-erasure transform are
part of this isolation mechanism.
