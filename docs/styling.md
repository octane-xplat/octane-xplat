# Styling screens

> Put reusable appearance in CSS classes and tokens; use inline style values
> only when the value changes while the app runs.

## The everyday rule

```tsx
<View className="card">
  <Text className="card-title">Profile</Text>
  <View style={{ opacity: disabled ? 0.5 : 1 }} />
</View>
```

- `className` is for layout, colors, typography, borders, and other stable
  choices.
- `style` is for runtime values such as an animated position or a measured
  size.
- Shared styles must use properties supported by both targets.

## Build a small token layer

Keep colors, spacing, and type sizes in tokens instead of repeating raw values
through every component. A theme can then change the whole app without
rewriting screens.

```css
:root {
  --color-surface: #fffdf5;
  --color-ink: #000;
  --space-4: 16px;
}

.card {
  background: var(--color-surface);
  color: var(--color-ink);
  padding: var(--space-4);
}
```

## Keep layouts honest

Flex layouts are the safest common starting point. Prefer `Row`, `View`, and
spacing classes over target-specific positioning. Check a screen at a narrow
browser width and on a native device before adding a platform split.

## Wrap text on native

NativeScript uses `white-space: wrap` to let `Text`/`Label` content flow onto
multiple lines. It rejects the web value `pre-wrap`. If web also needs
`pre-wrap` to preserve whitespace, set the values in platform-specific styles:
use `pre-wrap` on web and `wrap` on native. Native `wrap` enables line
wrapping, but does not preserve repeated spaces and newlines like web
`pre-wrap`.

For theme propagation, supported CSS differences, and the cases where a
platform leaf is necessary, see the [styling notes](styling-notes.md) and the
[CSS support notes](css-support-notes.md).
