Experimental AppKit containers now request native bounds clipping for hidden or
clipped overflow on both axes. Removing the style restores the view's original
clipping setting, including OS and specialized-view defaults.

```tsx
<masonview style={{ width: 160, height: 48, overflow: 'hidden' }}>
	<label text="Content inside the native bounds" />
</masonview>
```

Mixed axes and scrolling overflow remain unsupported. Native drawing,
hit-testing and packaged behavior remain unqualified. See the
[AppKit clipping subset](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer#clip-appkit-container-overflow).
