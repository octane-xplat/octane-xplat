### Wrap long text on macOS

Long labels now grow to fit their available width instead of keeping a
single-line height. An explicit height still controls the frame.

```tsx
/** @jsxImportSource @octane-xplat/macos-renderer */
export function Caption() {
	return <label text="A longer caption that can occupy several lines" style={{ width: 160 }} />
}
```

[AppKit label documentation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer)
