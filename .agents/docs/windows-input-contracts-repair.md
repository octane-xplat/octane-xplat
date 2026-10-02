# Windows input contract repair lab

Core source and the canonical preview patch repair the reproduced input seams.
**Windows OS validation is parked:** SSH reaches the jump host but the forwarded
Windows connection times out before executing a command. No component support
has been upgraded, and this candidate has not been installed in the guest.

## Ownership and behavior

The detached upstream checkout is based on
`7d0adcec9fa05e34668a7abacf3a79dab55325e6`, with the retained pointer commits
applied unchanged. Input source commit `468fe19f` is retained in
[windows-input-core.patch](../patches/windows-input-core.patch). It changes only
core input, accessibility, and property source plus a property regression spec.
There is no shared-component workaround, branch, push, or upstream PR.

| Contract          | Source repair                                                                                                                                                                           | Evidence boundary                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Public focus      | EditableTextBase calls native Focus directly and returns its boolean result; unloaded/disabled controls reject focus                                                                    | Mocked native calls; OS focus still pending                                             |
| Focus/blur events | Owned GotFocus/LostFocus subscriptions deduplicate transitions and retire on unload, disposal, and native identity replacement                                                          | Source and installed JS; bridge/UIA notifications still pending                         |
| Public blur       | Disable only a currently enabled, focused native control; restore effective model state, including changes made by a blur callback                                                      | Isolated mocked blur; no blur-button claim                                              |
| Disabled          | Windows View forwards isEnabled to native IsEnabled; inputs combine enabled and editable state                                                                                          | Native/UIA nonfocusability still pending                                                |
| Accessible name   | Windows View's label setter invokes the application accessibility callback; that callback calls AutomationProperties.SetName, including reset                                           | Setter/reset/replacement unit cases; UIA name still pending                             |
| Secure readonly   | PasswordBox has no IsReadOnly; core disables it while editable=false and restores it only if isEnabled and editable are both true                                                       | Fail-closed, nonfocusable fallback; no claim of a readonly ValuePattern                 |
| Replacement       | Secure swaps dispose old input/submit delegates and use setNativeView to reinitialize properties; text uses the guarded native write and previous focus is requested on the replacement | Mocked replacement and stale callbacks; real WinUI replacement still pending            |
| Literal values    | Property, CoercibleProperty, and InheritedProperty reset only on unsetValue; CSS properties keep their keyword reset behavior                                                           | Actual property constructors exercised with all four keyword strings and sentinel reset |

The input code uses the existing owned native-event subscriber without changing
its pointer implementation. Text/focus/Enter use the regular event projection;
the earlier source evidence already establishes these event properties on the
VM. Their current candidate lifetime has not been OS-tested. Gesture ownership
and unsupported routed-event projection remain qualified in
[the pointer repair note](windows-pointer-repair.md).

## Reproduction and regression evidence

The final 13-case input suite against original source reports 12 failures and
one pass (CSS resets). The repaired source reports 13 passes. The installed
candidate reports those same 13 passes plus all 17 existing pointer passes:

```sh
WINDOWS_CORE_SOURCE="$PWD/research/windows-input-contracts/core/packages/core" \
  node --test scripts/windows-input-regression.test.mjs
node --test scripts/windows-input-regression.test.mjs scripts/windows-pointer-regression.test.mjs
```

[The maintained test](../../scripts/windows-input-regression.test.mjs) evaluates
actual source or installed JS with a mocked base/bridge. It covers plain and
multiline input, native input/submit dispatch, readonly/disabled restoration
orders, stale text/focus/submit delegates, unload/reload/disposal, secure swaps,
isolated blur with a reentrant disabled change, explicit names, and generic/CSS
property reset separation. These are not OS keyboard or UIA passes.

The existing percentage helper passes against the installed View JS: lifecycle,
independent listeners, padding changes, and zero content extent. Every added
line from the previous canonical patch remains in the regenerated patch. The
input JS delta was applied to an edit tree containing that complete patch;
pointer and layout source were not replaced by an unpatched compilation.

`pnpm check:patches`, `pnpm check:recipes`, focused test-file lint/format, and
frozen-lockfile validation pass. The frozen install intentionally disables
scripts and strict ignored-build rejection; it does not establish postinstall
success. Normal postinstall reaches type generation but fails on the existing
uninitialized `ui-svg` submodule. Generated incidental declarations were
restored. The upstream full-suite command cannot start (`nx` is absent from the
detached checkout). The retained upstream property Vitest spec is not reported
as run. The retained TSRX case parses; it has not been prepared on Windows.

## Retained OS case and reopening

[Public input case](../tests/windows-input-contracts/case.windows.tsrx) and
[interactive keyboard/UIA script](../tests/windows-input-contracts/os-input.ps1)
are owned, retained lab fixtures, not a completed Windows pass. The case uses
production TextInput/TextArea handles and a file command channel. Public blur
is invoked without a button click or another focus-changing action. Secure
logs contain lengths only. Command files use synthetic lab values.

Reopen when this read-only command succeeds and session1's lab process can be
queried:

```sh
ssh -o BatchMode=yes -o ConnectTimeout=10 -J andromeda.local \
  -p2222 octane@127.0.0.1 whoami
```

1. Acquire the shared `research/windows-ui/batch-vm.lock` by atomic mkdir in the
   parent magic-grouse worktree. Check exit0 separately, then write the task
   owner. Never remove another task's lease.
2. Back up the guest's actual dependency files and smoke sources, including
   hashes. Install the exact local candidate JS/declarations; verify package
   pins and hashes before prepare. No native compilation is needed by this fix.
3. Copy the public case into `apps/windows/src/windows-ui-case.tsrx` and use the
   existing isolated lab entry/prepare helper. Launch via OctaneWindowsUILab;
   run the OS script in interactive session1, under the same lease.
4. Require UIA states **and** UTF8 console callbacks: public focus/isolated blur,
   ordinary input/change/submit, multiline Enter, disabled focus rejection,
   explicit/dynamic names, plain and secure readonly safety, all four literal
   values, both secure replacements, remount cleanup, and restoration. Confirm
   callback counts/order and no readonly/disabled changes. The retained script
   does not alone assert every callback or secure edit; extend the evidence
   before declaring the matrix passed. Selection/IME are separate gaps.
5. Restore original dependencies/binaries and the stable smoke bundle, compare
   hashes, prepare smoke, and confirm the interactive process is responsive
   before releasing only this task's lease. Record every result here.

Two bounded SSH attempts timed out before a Windows command; the verbose
attempt authenticated to the jump host and received a forwarding confirmation,
then timed out during banner exchange. No lease was acquired and no guest file,
process, dependency, binary, prepare, or OS probe was changed by this task.
Thus there are no new restoration hashes; the parent's last smoke prepare and
restoration hashes remain its evidence, and its live-process check is still
unconfirmed.

## Coverage and local state

`text-entry` AC1/AC2/AC3/AC4 and `component-refs` AC1/AC2 are related contracts,
but those recipes do not support Windows. Their requirements, public docs,
examples, and support targets remain unchanged. The repair restores existing
contracts within an experimental target; OS, selection/composition, modal
focus, and individual component evidence remain gaps. The Silo recipe table
also excludes Windows, so no supported-target audit was fabricated.

Windows validation is parked in Silo experiment
`198f0828-aa52-4dfb-97fa-0d51668092a0`. New original-expectation observations:
blur reenables disabled input `999369b0-63f3-4b78-aec6-9f6637ddc4a2`; secure
replacement leaves old delegates/state `152a6c2c-42c5-4d2d-9159-7d3bcaa0cf63`.
The inventory dispositions and other worktrees' rows are unchanged.
