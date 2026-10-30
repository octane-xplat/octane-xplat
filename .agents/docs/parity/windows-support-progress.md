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
