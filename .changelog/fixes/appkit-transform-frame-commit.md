### Keep macOS transforms after layout

Transforms now survive the native view's initial layout and later frame updates. Pending frame repaints stop when the view is replaced or removed.

```tsx
<masonview style={{ width: 120, height: 80, translateX: 10 }} />
```

See [macOS renderer setup](https://octane-xplat.goddardai.org/package-macos-appkit).
