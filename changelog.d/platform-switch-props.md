# Platform switches get an honest prop contract

`UISwitch` (`@octane-xplat/ui/ios`) and `MaterialSwitch`
(`@octane-xplat/ui/android`) previously typed their props as the shared
`SwitchProps` — including the field chrome (`size`, `status`, `width`,
`isLoading`, `isRequired`, `isLabelHidden`, `labelTooltip`) and
accessibility names that a bare OS widget never applied. Disabled and
labeled platform switches compiled but did nothing.

The widgets now take `PlatformSwitchProps`: the `checked`/`onCheckedChange`
state contract plus the field-state and accessibility props the host control
can deliver — `isDisabled` drives `isEnabled`, `isReadOnly` blocks toggling
without the disabled appearance, `testID` reaches the native view, and
`label`/`description`/`disabledMessage`/`accessibilityLabel`/
`accessibilityHint` resolve into the widget's spoken name and hint. Wrapping
a platform switch in `Field` still supplies the same states through context
and renders the visible label/description/status chrome.

Migrating: replace `SwitchProps` from `@octane-xplat/ui/ios` or `/android`
with `PlatformSwitchProps`, and move field-chrome props (`size`, `status`,
`isLoading`, `isRequired`, `width`, `isLabelHidden`, `labelTooltip`) onto an
enclosing `Field`. Values already typed as `SwitchProps` remain assignable —
the narrowed type only rejects props that were silently ignored.
