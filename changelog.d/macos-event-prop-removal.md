# macOS renderer unbinds dropped event props

An `on*` prop removed by a later render now unbinds on the AppKit driver instead
of firing its stale mount-render closure forever. Host updates merge into the
previous prop bag, so a dropped `onTap`, `onPan`, `onSwipe`, `onTouch`,
`onLongPress`, `onDoubleTap`, `onScroll`, `onTextChange`, `onSubmit`,
`onCheckedChange`, `onValueChange`, `onPress`, or `onLayoutChanged` used to keep
its recognizer, action handler, or observer live. The update path now injects
explicit clears for every dropped callback prop on every element type.

The iOS/Android lane already removed handlers correctly through the universal
renderer — see the new event-prop lifecycle entries in
`docs/testing/known-limits.md` for the contract on both platforms, including the
`useEffectEvent` idiom for hand-bound `view.on()` listeners.
