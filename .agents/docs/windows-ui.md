# Windows UI exploration lab

Baseline: `7c47480b` (rebased onto main on 2026-10-02).
Component register: [windows-ui-inventory.json](windows-ui-inventory.json).

The register covers 169 root-exported UI components. Each component starts
queued and must end implemented or parked, with evidence and a specific reason.
Native default implementations may be reused when their Windows behavior is
verified. Platform-authentic iOS/Android subpaths require a separate assessment.
Source inspection and compilation do not establish runtime or OS-input parity.

## Setup evidence

- SSH access to the Windows VM works. Testing uses an isolated checkout;
  the previous guest checkout is preserved.
- Normal workspace installation exposed a declaration-generator path mismatch:
  TypeScript's forward-slash project paths did not match Node's Windows paths.
  `665b3bfa` normalizes both sides. Auth and GIF generators passed on Windows;
  the existing generator pack and plain-TypeScript consumer tests passed locally.
- The next installation failure was a missing SVG submodule in the source
  archive. Both pinned vendor submodules have now been initialized locally.
- Windows PowerShell blocks the `pnpm.ps1` launcher under its current policy.
  Use `pnpm.cmd`; no execution-policy change is needed.

## Current verification

The new minimal native-label case has not booted yet. Installation, native
bundle compilation, interactive app launch, and the component sweep remain
in progress. No component is marked implemented based on setup alone.

## Documentation coverage

The setup fix preserves the existing typed-component-library recipe AC1/AC7;
its requirements and examples do not change. That recipe currently lists web,
iOS, and Android, and Silo recipe audits do not accept Windows. Windows evidence
is recorded here rather than mislabeled as another target's verification.
