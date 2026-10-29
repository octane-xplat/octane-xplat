### Use dashed and dotted borders on macOS

Native AppKit boxes now paint dashed and dotted borders, including rounded and
mixed-side styles. The FileInput dropzone's shared theme uses this path. None
and hidden sides consume no border width; removing style restores the existing
width-only solid default. Other decorative styles and non-solid outlines keep
their documented approximations. Native painting and installed-app qualification
remain pending.

```css
.attachment-target {
	border-width: 2px;
	border-color: #225588;
	border-style: dashed;
	border-radius: 8px;
}
```

See [native AppKit borders](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/styling.md#appkit-borders).
