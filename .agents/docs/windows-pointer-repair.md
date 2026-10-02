# Windows pointer observer repair

The pinned Windows core patch now carries independently owned pointer listeners,
shared hover lifetime, cancellation/capture-loss handling, and separated
single/double/long-press callbacks. Component dispositions remain unchanged;
this repairs a shared seam rather than certifying every control.

## Ownership

The source repair is in a local detached NativeScript checkout based on
`7d0adcec9fa05e34668a7abacf3a79dab55325e6`. The three source commits are
`49cd5d8ce`, `720e6bae7`, and `f82cbeba9`. Their complete source and regression
tests are retained in [the source patch](../patches/windows-pointer-core.patch).
There is no remote fork, push, or upstream PR.

The compiled runtime/declaration changes extend the existing canonical
`@nativescript/core@9.1.3-next.2` patch. Its prior CSS, frame/tab, and measurement
fixes remain included. The config package copy and lockfile must stay in sync.
Shared UI code has no workaround or new dependency.

## Evidence

The original-source regression reproduces replacement-only native event
properties dropping the earlier tap observer. It also exposes an unrelated
release bug: touch and other observer callbacks receive tap-shaped payloads.
The original expectation is preserved in local Silo feedback observation
`45ca6ad3-3a90-4c9d-b8e3-9ac5ca4fc5d8`.

Eighteen source tests pass, including the original reproduction. Seventeen
maintained tests execute the actual installed patched JavaScript:

```sh
node --test scripts/windows-pointer-regression.test.mjs
```

They cover independent removal/readdition, dispatch mutation, registration
rollback, ambiguous failure, hover ownership, unload/reload and native identity
replacement, canceled timers, disabled activation, and gesture coexistence.
They use a mocked bridge and do not establish native event projection or hit
testing.

The Windows 11 VM uses core preview `7d0adce`, Octane driver `0.2.4`, and Windows
runtime `0.1.0-alpha.144`. A compact probe used real OS mouse input and completed
with scheduled task result `0`:

| Case                        | Observed result                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| Single click                | Touch down/up, then one tap                                                                        |
| Double click                | Touch down/up twice, one double tap, no single tap                                                 |
| Hold                        | One long press; touch up; no tap                                                                   |
| Remove touch observer       | Tap and hover still work                                                                           |
| Restore touch observer      | Touch down/up and tap both work                                                                    |
| Remove/reinsert native view | Observers and hover work after real unload/reload                                                  |
| Native capture loss         | `CapturePointer` returns true; releasing capture delivers touch cancel and prevents tap/long press |
| Disable / enable            | No gesture callbacks while disabled; normal callbacks return after enable                          |

The final exact-package shared Pressable run completed with task result `0`.
The guest's two JavaScript files matched the local packaged source by SHA256.
After a warm-up click activated the window, the complete rerun produced four
`PRESS` callbacks and three `DOWN` callbacks:

1. Two normal clicks each deliver touch down and press.
2. Removing only touch leaves the next press working.
3. Restoring the saved callback/context restores touch down and press together.

The earlier multi-process batch was stopped after remaining running unexpectedly;
its partial result is not used as the completed lifecycle pass. An overlapping
layout prepare was restored before pointer testing; its results are not pointer
validation.

Final review hardened ambiguous AddHandler failures: when rollback also fails,
registration fails instead of risking a second listener. Known `E_NOINTERFACE`
delegate rejection still permits fallback. Failure branches are unit-tested;
the final packaged code also passes the real shared Pressable run.

## Remaining boundaries

- Routed AddHandler success and partial-failure paths are mocked evidence. This
  VM exercises the fallback because its delegate projection rejects AddHandler.
- Capture-loss is verified through a real pressed pointer and native capture
  release. Hardware touch cancellation and multiple simultaneous contacts are
  not covered.
- Native view replacement is unit-tested; remove/reinsert of the same native
  view is also OS-tested.
- Hover alone still depends on a gesture observer owning the view. Wiring hover
  for views with no gesture observers is a separate contract.
- Right-click coordinates and full long-press begin/end parity are not certified.
- Keyboard activation, accessibility semantics, native disabled-property mapping,
  and per-component styling remain separate tasks.

Public recipes and support claims remain unchanged. The repair restores existing
pointer contracts within the experimental Windows target; no new user workflow,
API, or component support claim is introduced. Lab state is tracked in local
Silo experiment `0f78465d-7f5e-4f52-b09d-55353c146b21`.

## Packaging checks and lab cleanup

`pnpm check:patches`, `pnpm check:recipes`, and the focused test-file lint and
format checks pass. Frozen lockfile validation passes with dependency scripts
intentionally disabled and the command's strict dependency-build check disabled;
that check does not establish postinstall execution. Normal postinstall reached
type generation but failed because this new worktree had not initialized the
existing `ui-svg` source submodule. No generated declarations are committed.

With pnpm 11, use an explicit `--patches-dir packages/cli/patches`. For the URL
preview selected by its package version, confirm that the edit tree contains the
existing patch; this run needed the original hunks applied before regeneration.
The final canonical diff adds gesture hunks and removes no original hunk. This
mismatch is recorded in local feedback observation
`cabdc643-3097-4a52-b0af-d77811d22457`.

Each VM lease restores the backed-up gesture dependency, removes the candidate
helper, prepares the stable public smoke bundle, and checks the live process.
Both restorations verified the original gesture SHA256. After the final batch,
stable smoke prepared successfully and the public-root process remained
responsive.
