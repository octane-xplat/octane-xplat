### Formatted letter spacing on AppKit

AppKit formatted text now carries inherited letter spacing into attributed
runs. Use finite points; a span can restore default spacing with zero.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Caption() {
	return <label><formattedstring style={{ letterSpacing: 1 }}>
		<span text="Spaced " /><span text="default" style={{ letterSpacing: 0 }} />
	</formattedstring></label>
}
```

Rich text also retains the host’s stylesheet-computed line height.

```css
.caption { line-height: 24px; }
```

Native shaping and layout remain unqualified. See the
[AppKit renderer](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer#apply-stylesheets).
