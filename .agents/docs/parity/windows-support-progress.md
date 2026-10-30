# Native Windows maintenance and qualification

Use this page to scope changes to the experimental WinUI target. The
[dated qualification report](../../../tools/platform-qualification/evidence/windows-support-progress-2026-10-30.md)
retains exact revisions, MSIX versions, input groups, boot/launch identities,
artifact paths, and failed predecessors. Historical candidate descriptions and
approval gates are not current setup instructions.

## Find the owning guidance

| Task | Read |
| --- | --- |
| Set up or build the host | [Windows host runbook](../windows-test-host.md), [lab findings](../windows-lab.md) |
| Change a shared control | [Windows UI contracts](../windows-ui.md), [component inventory](../../../tools/platform-qualification/evidence/windows-ui-inventory.json) |
| Change input, pointer, layout, or text plumbing | [Input repair](../windows-input-contracts-repair.md), [pointer repair](../windows-pointer-repair.md), [layout repair](../windows-layout-repair.md), [rich-text repair](../windows-rich-text-repair.md) |
| Inspect retained source repairs and fixtures | [Qualification tooling](../../../tools/platform-qualification/README.md) |
| Assess export presence | [Dated desktop source audit](native-desktop-support.md) |
| Change routing or modal ownership | [Routing contracts](../notes/routing-contracts.md), [navigation checks](../navigation-checks.md) |

## Evidence that must remain bounded

The report records real x64 OS-input/UIA qualification for common flows,
Switch, CheckboxInput, CheckboxList, Slider, RadioList, and SegmentedControl.
Each result applies to its named fixture, package, revision, and input groups.
It does not establish full component prop coverage or general Windows parity.

| Checkpoint | Recorded result and boundary |
| --- | --- |
| Merged main `838b4cf9b`, MSIX 1.0.0.41 | Common text/keyboard/modal/scroll/filesystem flows 15/15, RadioList 11/11, SegmentedControl 12/12; declaration tasks still failed at that checkpoint |
| Windows text wrapping | Production candidate repaired the nested foreign-text frame and intrinsic measurement; matched 220×40-DIP wrapping in three cases; the broader comparator was 83/91, not a full pass |
| MasonKit beta.129 adoption | See the report's adopted-package wrapping/UIA evidence and typecheck comparison; candidate DLL results alone are not adoption evidence |
| Clean frozen install at `a57b1b8729bb976a851569c779f5efacd782fb79` | Fresh Windows worktree passed with exit 0 and 37/37 postinstall tasks; supersedes the earlier install failure, but does not qualify an MSIX build or a component |

Narrator, hardware touch/pen, visual parity, the complete Field/props/lifecycle
matrices, packed downstream consumers, other architectures, and other Windows
versions retain their own gates. Mocked RTL/Home/End/Ctrl-arrow contracts are
not OS-input results. Static UIA names and boxes are not Narrator evidence.

## Keep upstream repairs visible

Retained source patches and fixtures live under
`tools/platform-qualification/`; applied consumer patches remain canonical in
`packages/cli/patches/`. Keep their owning NativeScript preview commits and
removal conditions with the relevant repair note and patch manifest.

The report distinguishes explicit synchronous filesystem bridge calls from
projection failures; do not turn a failed existence query into “missing file.”
Input subscriptions, pointer capture, composition, controlled rollback, and
modal focus restoration require lifecycle cleanup and stale-work rejection.
Use the linked repair notes for each contract rather than reconstructing it
from a successful launch or an export declaration.

Mason's shared component path differs from NativeScript FlexboxLayout. The
reported shared padding/shrink probe did not reproduce the old Flexbox overlap;
do not carry an unrelated binary repair into that path. The text wrapping
investigation identifies the affected MasonKit beta.126 foreign-leaf measurement
and records the later beta.129 adoption separately.

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
See the [layout driver guide](../../../tools/windows-qualification/README.md).

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
