### Control which Mason views receive pointer input

Mason Core beta.13 adds pointer event data and pointer capture to Mason views on iOS and Android. Use `pointer-events: none` on a decorative Mason overlay so it can let touches through.

```css
.decorative-overlay {
  pointer-events: none;
}
```

[Mason Core beta.13 release notes](https://github.com/octane-xplat/nativescript-mason/releases/tag/core-v1.0.0-beta.13)
