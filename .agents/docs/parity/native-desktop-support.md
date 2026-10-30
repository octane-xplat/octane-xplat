# Native desktop export audit

This source audit replaces the earlier documentation-only census with a
reproducible export inventory and reviewed implementation findings. It covers
native Windows/WinUI, macOS/AppKit and Linux/GTK, excluding WebView app backends.
The tracking issues remain open: [Windows #61](https://github.com/octane-xplat/octane-xplat/issues/61),
[AppKit #62](https://github.com/octane-xplat/octane-xplat/issues/62) and
[GTK #63](https://github.com/octane-xplat/octane-xplat/issues/63).

Snapshot: `55f1b4ebd2d9340c94e5a737fc3ae99f3ef7ffb5`, 2026-10-28.
No desktop runtime, OS input, accessibility, visual or packaging test was run
for this audit. A minimal Windows Vite resolver diagnostic was run; it is not
a production build. Source-present means the declaration was found, not that
its behavior works on the target. This audit cannot establish that every
behavioral gap has been discovered.

## Inventory and evidence

There are 72 packages with export maps, 460 normalized entrypoints and 1,617
union export rows per target. Rows include functions, constants, components,
type/asset entrypoints and platform-specific APIs; these are not component or
supported-feature counts. The scan parsed 1,822 source files without remaining
parse errors. Fifty-one reviewed findings describe concrete subsets, gaps or
qualification boundaries.

| Artifact | Contents |
| --- | --- |
| [Windows export rows](../../../tools/desktop-support/windows.tsv) | Entry, declaration, signature, scope, subset, gap and finding IDs for every inventoried export |
| [AppKit export rows](../../../tools/desktop-support/macos.tsv) | Same schema, selected using AppKit conditions/extensions |
| [GTK export rows](../../../tools/desktop-support/gtk.tsv) | Same schema, selected using GTK conditions/extensions |
| [Reviewed findings](../../../tools/desktop-support/findings.json) | Explicit subset, remaining gap and source paths; distinct from keyword candidates |
| [Dependency candidates](../../../tools/desktop-support/dependency-candidates.json) | Foreign platform imports, missing paths and missing named core-shim exports |
| [Snapshot](../../../tools/desktop-support/snapshot.json) | Package/entrypoint census, exclusions, conditions, source SHA-256 hashes, parser fallback and resolution counts |
| [Windows resolver output](../../../tools/desktop-support/windows-resolution.json) | Actual minimal Vite resolution; null results for packages undeclared by the harness are not missing-export findings |

The key is `(package, subpath, export, target)`. A runtime export can be present
while importing incompatible modules, emitting unregistered widgets or ignoring
props. A type-only export has no independent runtime capability. Scope columns
prevent a web/build/OS-authentic entry from being counted automatically as a
desktop gap. `ui/linux` is the Linux WebView host's type entry, selected by the
`linux` condition; it is not a native GTK capability entry.

The baseline is the union of web, Windows, AppKit and GTK exports. Mobile-only
APIs without any selected entry are outside that union; platform-authentic
subpaths are retained for explicit scope decisions. Wildcard modules are
normalized by basename; their exact source files remain in the snapshot. The
inventory does not expand every arbitrary explicit-extension spelling. Upstream
OS SDK members are aggregated instead of turning tens of thousands of SDK
bindings into framework parity requirements. External package implementations
are unqualified forwards, not recursively audited dependencies.

## Findings that change the backlog

Windows has both explicit unsupported leaves and misleading mobile fallbacks.
The default platform device reports Android on Windows, settings/auth advertise
availability without a Windows branch, clipboard reads return null, and random
bytes lack a desktop implementation. Audio and recorder select mobile backends.
Other services delegate to mobile plugins whose desktop support remains
unqualified; do not turn facade presence into a support claim.

The Windows native preset actually selects `ui/index.mobile.ts`; its explicit
mobile imports conflict with the production boundary's Windows-only policy.
GIF's manifest selects `index.ts`, whose explicit `AnimatedImage.tsrx` import
bypasses the existing Windows leaf. Maps similarly imports an explicit generic
visual leaf. These are source/resolution risks, not newly observed production
build failures. Several telemetry/ad leaves forward to a foreign platform file,
which must be reconciled with the boundary checker.

AppKit files can pick but cannot read/write/export. Image cache APIs are no-ops,
false results or `none`; the image leaf forwards only a subset of the image
contract. SegmentedControl, Canvas, Video, Pager and GIF have placeholder or
nonfunctional paths. Shaders explicitly return unsupported. Focus containment,
keyboard/grid hooks, reveal, sticky columns and speech recognition have missing
behavior even when their exports exist. Motion has a real NSView host, but drag
throws and desktop layout is disabled. Chart scrubbing is not wired in its leaf;
the renderer itself now has touch support. Hosted rich-text editors remain
WKWebViews and must be tracked separately from native text editing.

GTK's curated root exports only Text and Pressable: 355 of the 357 union UI-root
runtime exports are absent. Neither exported component proves full parity:
formatted text is incomplete and the driver lacks the touch/pan/swipe event
protocol used by Pressable. Other purpose/wildcard exports still select default
NativeScript leaves. CameraView and RichTextEditor have no selected GTK/default
leaf; editor wrappers inherit that gap. The core shim lacks named imports used
by shared services, uses in-memory settings and does not monitor connectivity.
The native IntersectionObserver backend expects NativeScript Views, not GTK
widgets. Renderer CSS state selectors, resize media queries and animations
already exist and must not be listed as absent.

The complete reviewed subsets and evidence paths are in `findings.json` and are
joined into each matching TSV row. Unmatched source rows deliberately retain
an explicit qualification gap; absence of a reviewed finding is not a support
verdict. Keyword hits remain candidates because comments, error handling and
unsupported optional branches do not establish whole-export failure.

## Reconcile historical qualification

The Windows 169-component/141-parked census predates this source snapshot. Keep
its historical failures, but do not equate its names or counts with this export
union. At audit time Silo `windows_checks` held 570 rows: 566 pending, three
failed and one running. The failed layout/input/intl scenarios refer to older
isolated artifacts; the running workflow uses another worktree and experimental
overlays. Neither is current-canonical runtime evidence. This audit did not
modify those qualification rows.

GTK's original 212-row matrix mixes components, services, renderer and tooling.
Its rows remain useful requirements, not a current export census. The new
inventory supplies the export-level reconciliation; renderer/host/distribution
requirements remain in #63. Retained-pane assertions using Gtk.Box emulation
do not qualify native Mason, OS Back, modals or route transitions.

AppKit's older camera/audio/Lottie and gesture summaries are not reliable
absence evidence. Dedicated leaves now exist. Source existence still does not
qualify actual permissions, bridge availability, IME, focus, scrolling, memory,
packaged consumers or accessibility. Intel support and signing/notarization
remain separate distribution requirements.

## Reproduce and maintain

Run from the repository root with the workspace dependencies installed:

```sh
mkdir -p research/desktop-audit
node tools/desktop-support/collect.mjs research/desktop-audit/inventory.json
node tools/desktop-support/render.mjs research/desktop-audit/inventory.json
node tools/desktop-support/windows-resolution.mjs
```

The collector reads manifests, parses declarations/re-exports and follows
static imports. It does not execute application modules. The renderer joins
reviewed findings and records hashes. One ordinary TypeScript file containing
XML regex literals requires a parser fallback: TypeScript identifies regex
spans, which are masked without moving offsets before TSRX parsing. Original
source provides evidence and signatures. The fallback is recorded explicitly.

The static resolver approximates preset selection; dynamic imports, runtime
capability checks, plugin transforms and native SDK/linker behavior require
separate verification. Dependency candidates are not necessarily reachable
from every named export, and tree-shaking can affect production results.
Use a production build before filing a candidate as a confirmed build failure.
For changed source, rerun the census, review the diff and update findings with
operation-specific evidence. Do not auto-close issue checkboxes from export
presence, successful typechecking or direct handler dispatch.

This change adds internal audit records and tools only. No public behavior,
recipe, example or supported-platform promise changes; no release note or
package typecheck is required. Runtime qualification remains in the three
tracking issues.
