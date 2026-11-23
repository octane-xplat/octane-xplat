# Own AppKit primary actions across nested controls and lifecycle changes

ID: appkit-nested-clicks
Targets: macos
Related APIs: ClickableCard, Button, Selector, Checkbox, Switch, RadioList, CheckboxList

## Starting point

A card or picker trigger contains another actionable control, or a self-drawn
choice changes between disabled, read-only and interactive states after mount.

## Requirements

Keep a nested AppKit control's own action separate from its card or picker
container's primary click. Keep self-drawn choice actions current and owned
when their callbacks or interactive state change.

## Acceptance criteria

- AC1: Primary click ownership follows the actual native hit ancestry using content-superview coordinates. Missing, foreign or detached hits cannot claim an ancestor action.
- AC2: Registered native controls, semantic widgets (including disabled widgets) and live action hosts block ancestor clicks. Passive labels/images/groups remain clickable content.
- AC3: Current metadata and callback ownership are read at attempt time; recognizer reuse, unrelated gesture defaults and same-view simultaneous policy remain intact.
- AC4: Distinguish authored source cases from native delegate registration, physical clicks, keyboard/AX, long presses and foreign-engine arbitration. Leave runtime evidence gates open.
- AC5: An existing accessibility/action ID must not prevent acquiring a click recognizer when a callback appears. Update callbacks through one recognizer without duplicate delivery; clearing a noninteractive host must not manufacture an action.
- AC6: Callback removal disables the recognizer, re-adding reuses it, raw disabled changes update its state and queued callbacks still reject disabled actions.
- AC7: Teardown disables/removes owned click recognizers. Keep source cases separate from real pointer/keyboard re-enable behavior, native gesture arbitration and packaged lifecycle evidence.

## Documentation

- AC1: [Renderer contract](../../../packages/macos-appkit/src/primary-click.ts) and [coordinate/ancestry cases](../../../packages/macos-appkit/test/primary-click.test.ts).
- AC2: The [renderer contract](../../../packages/macos-appkit/src/primary-click.ts) and [boundary classification cases](../../../packages/macos-appkit/test/primary-click.test.ts) document passive versus interactive descendants.
- AC3: [Action lifecycle cases](../../../packages/macos-appkit/test/click-action-lifecycle.test.ts) and [delegate cases](../../../packages/macos-appkit/test/gestures.test.ts) cover live ownership and opt-in gates.
- AC4: The contract and [target note](../exploration.md#operational-evidence) record limitations and exact deferred commands. All authored cases require separate execution evidence.
- AC5: [Click ownership contract](../../../packages/macos-appkit/src/primary-click.ts) and [authored lifecycle source cases](../../../packages/macos-appkit/test/click-action-lifecycle.test.ts).
- AC6: The same contract/cases and [queued press guard case](../../../packages/macos-appkit/test/gestures.test.ts); actual raw disabled updates still require native verification.
- AC7: The [target note](../exploration.md#operational-evidence) records teardown source scope and exact deferred commands. No native lifecycle/OS input evidence is claimed.

Historical Silo assessments for `appkit-click-actions` AC1–AC3 map to
`appkit-nested-clicks` AC5–AC7. They remain evidence for their reviewed
revisions, not a pass for this revision.
