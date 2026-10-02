# Compose action controls and interactive cards

ID: interactive-actions
Targets: web, ios, android, macos
Related APIs: Button, IconButton, ButtonGroup, ToggleButton, ToggleButtonGroup, ClickableCard, SelectableCard, MoreMenu

## Starting point

The app needs reusable actions, connected button controls, selectable cards,
or an overflow action menu across supported targets.

## Requirements

- Choose between labeled, icon-only, toggle, and overflow actions.
- Group related actions with a shared accessible label and disabled/size defaults.
- Keep selection or navigation state controlled by the app.
- Preserve link and accessibility behavior where the platform supports it.

## Acceptance criteria

- AC1: A maintained example shows Button, IconButton, ToggleButton, and ButtonGroup composition.
- AC2: The guide explains single/multiple toggle-group state and MoreMenu presentation.
- AC3: The guide explains card selection/navigation semantics and web/native link differences.
- AC4: The guide documents Button legacy prop migration and pending action behavior.

## Documentation

- AC1: [Action controls guide example](../docs/app/interactive-actions.md#action-controls-and-interactive-cards) and the maintained [action controls demo](../packages/demos/src/ActionControlsDemo.tsrx).
- AC2: [Groups, toggles, and overflow menus](../docs/app/interactive-actions.md#action-controls-and-interactive-cards).
- AC3: [Interactive cards and links](../docs/app/interactive-actions.md#interactive-cards).
- AC4: [Button compatibility](../docs/app/interactive-actions.md#button-compatibility).
