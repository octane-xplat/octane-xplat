# Keep nested AppKit primary actions separate

ID: appkit-nested-clicks
Targets: macos
Related APIs: ClickableCard, Button, Selector

## Starting point

A card or picker trigger contains another actionable control.

## Acceptance criteria

- AC1: Primary click ownership follows the actual native hit ancestry using content-superview coordinates. Missing, foreign or detached hits cannot claim an ancestor action.
- AC2: Registered native controls, semantic widgets (including disabled widgets) and live action hosts block ancestor clicks. Passive labels/images/groups remain clickable content.
- AC3: Current metadata and callback ownership are read at attempt time; recognizer reuse, unrelated gesture defaults and same-view simultaneous policy remain intact.
- AC4: Distinguish authored source cases from native delegate registration, physical clicks, keyboard/AX, long presses and foreign-engine arbitration. Leave runtime evidence gates open.

## Documentation

- AC1: [Renderer contract](../../../packages/macos-renderer/README.md#nested-primary-clicks) and [coordinate/ancestry cases](../../../packages/macos-renderer/test/primary-click.test.ts).
- AC2: The renderer contract and boundary classification cases document passive versus interactive descendants.
- AC3: [Action lifecycle cases](../../../packages/macos-renderer/test/click-action-lifecycle.test.ts) and [delegate cases](../../../packages/macos-renderer/test/gestures.test.ts) cover live ownership and opt-in gates.
- AC4: The contract and [target note](../exploration.md#operational-evidence) record limitations and exact deferred commands. All authored cases require separate execution evidence.
