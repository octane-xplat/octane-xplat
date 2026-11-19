### Save and restore a desktop window's bounds

Read or request the outer window frame on AppKit and supported Windows hosts. The coordinates match the desktop display layout on that host.

```ts
if (inspector.supportsBounds) {
  const bounds = inspector.getBounds()
  inspector.setBounds({ ...bounds, width: bounds.width + 80 })
}
```

See [Save and restore a window's bounds](https://octane-xplat.goddardai.org/package-desktop#save-and-restore-a-windows-bounds).
