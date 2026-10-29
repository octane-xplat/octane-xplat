### Type multiline keyboard and Return props

GTK multiline intrinsic usage no longer fails typechecking when it supplies
keyboardType, returnKeyType or onReturnPress. These props already work at runtime.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Notes() {
  return (
    <textview keyboardType="email" returnKeyType="done"
      onReturnPress={() => console.log('Done')} />
  )
}
```

GTK supports done/send submission; other Return types insert a newline.
[GTK multiline input](https://octane-xplat.goddardai.org/platform/linux-gtk)
