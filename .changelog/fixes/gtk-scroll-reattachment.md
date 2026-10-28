### Keep GTK scrolling content attached during updates

GTK scrolling hosts now keep content attached when wrappers move or reinsert
their children during updates. This fixes content disappearing beneath a
viewport managed by GTK.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Content() {
  return (
    <scrollview>
      <proxyviewcontainer>
        <label text="Content stays attached" />
      </proxyviewcontainer>
    </scrollview>
  )
}
```

[GTK development guide](https://octane-xplat.goddardai.org/platform/linux-gtk).
