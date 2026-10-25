### Button is a real `<button>` on web

`Button` now renders a native `<button type="button">` instead of
`div[role="button"]`, gaining built-in focus, Enter/Space activation, and the
`disabled` attribute. A `Button` with both `tooltip` and `isDisabled` uses
`aria-disabled` and stays focusable so the tooltip remains reachable. Other
`Pressable`-based controls still render divs.

```tsx
<Button label="Save" clickAction={save} />
// <button type="button" class="vx-pressable vx-button …">
```

**Breaking change:** selectors and tests that target `div.vx-button` or rely
on `tabindex`/`role="button"` must be updated to the `button` element.

[Button](https://octane-xplat.dev/app/components/)
