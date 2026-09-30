# Input and focus readiness evidence

This is the 2026-09-30 qualification pass based on main
`4b43f82d6c6c6963d081040eb44591c9b9560a67`. Q4's 2026-09-25 iOS ASCII
runtime pass is historical evidence. Q15's property mappings are distinct
from actual assistive navigation. Recipe coverage and runtime evidence are
recorded separately in Silo.

## Reproduced defects and focused fixes

| Defect | Reproduction and regression | Change |
| --- | --- | --- |
| Web Pressable cannot be reached or activated by keyboard | Compiled DOM tests failed Tab-index/Enter/Space assertions before the change; Chromium now types and activates with trusted keyboard events | Enabled actions enter the Tab sequence; Enter and Space activate once, with repeat/descendant/composition guards |
| Disabling a held long press still fires its action | Fake-timer test failed after disabling during the 500 ms hold | Cancel pending holds on disable/unmount and read the latest enabled state |
| Enter confirms composition and prematurely submits | Composition key events failed submission guards for TextInput, TextArea and SearchInput | Skip submission while composing, including legacy keyCode 229 |
| Native imperative controlled writes produce duplicate onChange | Compiled leaves against the object driver model NativeScript's synchronous Property textChange; initial/reset writes reached callbacks before the fix | Suppress only the leaf's synchronous controlled writes, preserving real edit callbacks and Android selection clamping |
| Native blur falls through after dismissSoftInput returns void | Compiled handle test threw when the NativeScript-shaped view had no blur method | Choose dismissal by method availability; clear Android editing focus after hiding the keyboard |
| Disabled native Pressable can report selected instead of disabled | Object-driver state assertion failed before the change | Give the actual disabled prop priority in the native accessibility mapping |
| Android keyboard inset uses physical pixels as dips | Density-two inset test expected -250 dips and received -500 | Convert the IME minus system-bar inset to device-independent layout units |
| Shaded web overlays leave background keyboard/AX content reachable | Compiled Sheet/Overlay focus tests failed before isolation; Chromium verifies Tab cycle and background AX exclusion after the fix | Own a nested modal focus scope, inert background portals, Escape dismissal and connected-trigger restoration |

Tests are maintained in `packages/ui/src/input-readiness.web.test.tsrx`,
`modal-focus.web.test.tsrx`, `text-input.mobile.test.ts`,
`pressable-accessibility.mobile.test.ts`, and `keyboard-inset.mobile.test.ts`.
Native models reproduce the component/driver seam; they are not OS runtime
or real-IME tests.

## Completed checks

- Web component regression suite: 11 tests passed, including SearchInput's existing tests.
- Native object-driver suite: 12 tests across six files passed.
- Chromium runtime: trusted Tab/Enter/Space, typing `hello`, replacing selection
  [2,4] with `XY` to obtain `heXYo` with cursor 4, and a controlled reset with
  no extra callback passed. Shared Sheet/Overlay Tab cycles, Escape and
  trigger restoration, nested overlays, and Chromium AX-tree background
  exclusion passed. Exiting Presence blocks focus/input and reversal restores
  interaction. No OS IME or screen reader was exercised.
- Android emulator runtime (`emulator-5566`): OS key injection into the real
  EditText inserts `abc` at cursor 0: `hello` becomes `abchello` in three
  callbacks with cursor [3,3]. Replacing [2,4]
  with `XY` gives `heXYo`, two callbacks, cursor [4,4]. Controlled replacement
  keeps the callback count and cursor unchanged; blur reports hasFocus=false.
  An unguarded baseline property write reproduced an extra callback and cursor
  [0,0]. The probe uses the current canonical patches and a separate bundle ID.
  TalkBack was disabled. This is real widget/key-event evidence, not marked-text
  IME composition or physical software-keyboard typing.
- `pnpm typecheck:web`, UI web/native distribution builds and native-dist
  invariant check passed. The docs build passed.
- Changed TypeScript/runner files pass targeted oxlint. Whole-repo lint has
  errors outside this change; mobile typecheck has platform metadata and
  platform-leaf errors outside the changed input components.
- The full iOS simulator harness build passed. Full Android harness build
  stopped at the push plugin's missing `google-services.json`; no credentials
  were fabricated or optional service support removed from the app.

Run the browser qualification with
`pnpm --filter @xplat/web exec node scripts/input-readiness.mjs`.
The runner selects an OS-assigned local port and captures no images.
Native checks use a shared per-target advisory lock; Android builds select
Temurin JDK21. Native build success alone does not verify editing behavior. The isolated
input probe built for both targets. The iOS app was installed/launched through
simctl on the already booted simulator, but AX inspection found an existing
“Open in mobile?” system prompt. It was left untouched, so no fresh iOS editing
pass is claimed. Android commands pin the emulator serial; a physical device
attached during the first run caused an ambiguous adb command. The repeat
pinned the serial, passed, and restored the previous foreground app.

## Remaining runtime qualification

- Android emulator EditText ASCII/cursor/controlled-write/blur checks pass as
  described above. Physical-device software-keyboard input and SearchInput
  real-widget editing still need qualification; TextInput was the typing target.
  The mirrored TextArea received controlled writes but was not independently
  typed into. The attached physical Android handset is securely locked
  (keyguard showing=true); it was not unlocked. Fresh iOS editing is blocked
  by the existing system prompt.
- Marked-text IME composition on both native targets remains unverified:
  actual keyboard interaction is still needed; key injection bypasses the IME.
  Confirm composition, replace a selected range, reset controlled values,
  and check callback counts using the actual OS keyboard. Synthetic web
  composition events establish only the submission guard.
- VoiceOver and TalkBack actual focus order, names, disabled activation,
  modal isolation/return focus and exiting Presence exclusion remain
  unverified. Chromium AX-tree inspection and native property readback do not
  establish speech or assistive interaction.
- Native keyboard avoidance must be exercised with the last field, a sheet
  opened while the keyboard is already visible, dismissal and restoration.
  The density conversion test does not establish the visible viewport.
- The separate `@octane-xplat/sheet` web BottomSheet still lacks focus
  qualification; shared Sheet results do not cover it. Native shared and
  platform-sheet isolation also need their own runtime checks.
- Current Motion evidence includes the 2026-09-30 iOS simulator rerun. This
  pass makes no motion-engine changes and does not replace that evidence.

The maintained native [probe](../apps/mobile/test/input-readiness.mobile.tsrx)
exposes Focus, Select middle, Controlled write, Blur, Reset and Inspect actions.
Its Baseline write deliberately assigns native.text directly to reproduce the
old echo path; applications should use controlled value instead. It was mounted
in an isolated NativeScript app with core 9.1.2, driver 0.2.4 and Octane 0.6.3
plus the canonical framework patches, avoiding optional service credentials.

The retained local diagnostic logs live in gitignored
`research/input-readiness-evidence/`. The maintained fixtures and the
conclusions above are the reviewable evidence in Git.
