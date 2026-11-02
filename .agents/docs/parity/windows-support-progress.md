# Native Windows maintenance and qualification

Use this page to scope changes to the experimental WinUI target. Keep run
histories, inventories, component dispositions, and pending checks in Silo/local
files. Use [operational evidence lookup](../exploration.md#operational-evidence)
to locate historical reports without treating them as current instructions.

## Find the owning guidance

| Task | Read |
| --- | --- |
| Set up or build the host | [Windows host runbook](../windows-test-host.md), [lab findings](../windows-lab.md) |
| Change a shared control | [Windows UI contracts](../windows-ui.md), [component inventory](../exploration.md#operational-evidence) |
| Change input, pointer, layout, or text plumbing | [Input repair](../windows-input-contracts-repair.md), [pointer repair](../windows-pointer-repair.md), [layout repair](../windows-layout-repair.md), [rich-text repair](../windows-rich-text-repair.md) |
| Inspect retained source repairs and fixtures | [Qualification tooling](../../../tools/platform-qualification/README.md) |
| Assess export presence | [Desktop source audit method](native-desktop-support.md) |
| Change routing or modal ownership | [Routing contracts](../notes/routing-contracts.md), [navigation checks](../navigation-checks.md) |

## Evidence that must remain bounded

Read `windows_checks` before choosing or qualifying a control. Exact source
revision, packaged artifact, architecture, input mechanism, and bounded assertions
belong with each execution record. A successful common-flow fixture does not
establish the full component props, Field/lifecycle, or platform matrix.

Keep handler dispatch, OS input/UIA, Narrator, hardware touch/pen, geometry, visual
parity, downstream consumers, other architectures, and other Windows versions as
independent evidence. Mocked keyboard contracts are not OS-input results; static
UIA names/boxes are not Narrator evidence. A clean install is a separate gate
from component behavior or MSIX production.

## Keep upstream repairs visible

Retained source patches and fixtures live under
`tools/platform-qualification/`; applied consumer patches remain canonical in
`packages/cli/patches/`. Keep their owning NativeScript preview commits and
removal conditions with the relevant repair note and patch manifest.

Distinguish explicit synchronous filesystem bridge calls from
projection failures; do not turn a failed existence query into “missing file.”
Input subscriptions, pointer capture, composition, controlled rollback, and
modal focus restoration require lifecycle cleanup and stale-work rejection.
Use the linked repair notes for each contract rather than reconstructing it
from a successful launch or an export declaration.

Mason's shared component path differs from NativeScript FlexboxLayout. Do not carry a Flexbox-specific binary repair into the shared Mason path without
a reproduction. The foreign-text measurement investigation examined beta.126;
check the adopted MasonKit source and current bounds before retaining a fix or
claiming it is no longer needed.

## Core-20 qualification result (1.0.0.195)

All 20 core components passed OS/UIA qualification on one packaged x64 MSIX —
`org.octanexplat.windows61` 1.0.0.195 (sha256 `8de19133e8850a1cc2b2f3f5947ed425819e0aee9b3eb183d5e0bc5b8c20e977`),
built on Windy from a fresh `bun install --frozen-lockfile` at source commit
`7172b169e` (the git-am'd equivalent of `main` commits through `f2b4c5ee1`;
later commits touch only drivers/tests). Ten external driver modes on the one
installed package: actions 258, list-item 97, display 352, tabs 139, selector
289, menu 370, table 86, layer 108, layer-focus 25, structure 194 assertions —
all passed. Per-component rows: `windows_checks` `scenario:windows-os-*` —
see [windows-setup.md](../../../docs/platform/windows-setup.md) for the public
summary. Bounds still open: Narrator, visual parity, touch/pen, ARM64,
downstream consumers, full props matrices, other Windows versions.

Two host constraints met during the gate: `Add-AppxPackage` must run in the
interactive session (plain SSH fails `0x80070005` "Failed to initialize PLM") —
use `normal-task-helper.ps1`; and each driver run needs a fresh evidence
directory.

## Continue qualification

Start from the current pinned dependencies and the maintained host runbook.
Record the exact build revision, artifact identity, actual target and input
method, failures, and remaining gaps. Rerun checks affected by a change rather
than repeating every historical candidate. Source/typecheck evidence,
installation, package build, and OS behavior remain separate results.

Plans are maintained outside `.agents/`. Open work and recipe verification live
in Silo; do not append another implementation sequence to this reference.

## Qualification host constraints

For percentage-width layout cases, give the private host root an explicit
`width: 100%` (through `VStack.width`). An auto-sized root can remain
content-sized even when WinUI assigns a wider frame, making responsive child
cases appear broken. Check numeric host frames as well as UIA bounds:
content-sized accessibility groups do not necessarily describe container frames.
See the [component driver guide](../../../tools/windows-qualification/README.md).

Read a command/event file held open by NativeScript with explicit shared-stream
access; do not silently ignore sharing exceptions. Bound each external UIA read
in a child process so the driver can preserve a timeout and stop its owned app.
A timeout alone does not establish a threading-apartment or upstream filesystem
API defect. Keep each command acknowledgement bound to its launch identity.

Diagnostic overlays and JavaScript replacements in an existing native package
are separate from a fresh source build and final clean-main packaged run.
Harness/scenario qualification does not advance component or issue-wide gates.
Use the [shared-host artifact convention](../host-artifacts.md) and reuse the
host's persistent source checkout while keeping per-run artifacts disposable.


## Native action contracts

Use the [Windows action guide](../../../docs/platform/windows-setup.md#buttons-and-links)
for the shared Button, Pressable and Link surface, and the
[maintained action driver](../../../tools/windows-qualification/README.md#run-action-checks)
for keyboard, pointer, Invoke, state/lifecycle and numeric-frame checks. Native
Click owns activation; do not add a second tap handler to the Mason drawing.

Find the bounded action scenario and exact artifact identities in Silo:

```sh
silo row get windows_checks scenario:windows-core20-actions
```

Keep the final clean-main component rows separate from this diagnostic scenario.
Link has no public disabled prop; injected navigation and external URL launching
need separate evidence. The Windows-only no-callback Tab-stop guard also needs
inclusion in the next source build. Source/controller tests do not establish a
packaged path that has not been run.

## Native panel-tab contracts

Use the [Windows panel-tab example](../../../docs/platform/windows-setup.md#panel-tabs-candidate)
for controlled local panels and the maintained
[tab action mode](../../../tools/windows-qualification/README.md#run-panel-tab-checks)
for native selection, OS input and lifecycle checks. Keep the
[WinUI construction constraints](../windows-ui.md#native-tab-semantics)
beside the adapter; projected class presence and mocked events do not establish
usable native peers.

Read the bounded public-adapter record independently of the final component gate:

```sh
silo row get windows_checks scenario:windows-core20-tabs-public-adapter
silo row get windows_checks scenario:windows-os-tab-list
```

Retain failed UIA/model selection mismatches. Header drawing, native selection,
panel content and Tab order need separate assertions; a callback alone does not
prove they agree. Structural updates, rich-slot geometry, overflow, panel
relations and the full fresh-main run remain separate qualification work.

## Native single-selection contracts

Use the [Windows Selector example](../../../docs/platform/windows-setup.md#single-selection-candidate)
and [Selector input mode](../../../tools/windows-qualification/README.md#run-selector-input-checks)
for the finite single-choice path. Keep framework option content in the packaged
checks: a plain-string ComboBox can expose valid popup bounds while a custom
hosted-content template fails. Preserve the focus-target Grid and typed chrome
accessors described in the [selection constraints](../windows-ui.md#single-selection-controller-candidate).

```sh
silo row get windows_checks scenario:windows-core20-selector-input
silo row get windows_checks scenario:windows-os-selector
```

A bounded diagnostic pass does not qualify search, multiple selection, grouped
or long lists, the full props matrix, Narrator or the final fresh-main package.
