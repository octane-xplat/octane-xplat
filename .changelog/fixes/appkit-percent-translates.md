### Preserve percentage translations on macOS

Percentage translations now retain the CSS engine's resolved value and follow changes to the element's size, including translations supplied by animations.

```tsx
<masonview style={{ width: 120, height: 80, translateX: '25%' }} />
```

See [macOS renderer setup](https://octane-xplat.goddardai.org/package-macos-appkit).
