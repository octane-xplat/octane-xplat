### Add a multiline editor to GTK screens

The experimental GTK renderer now supports the textview intrinsic for
multiline text, read-only editing, focus and change events. Return adds a
line; done/send can submit instead. Tab moves to the next control.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function NotesEditor() {
  return (
    <textview
      text="First line"
      onTextChange={(event) => console.log(event.value)}
      style={{ width: 260, height: 120 }}
    />
  )
}
```

The public TextArea component still needs row sizing, growth and placeholder
qualification. [GTK text entry](https://octane-xplat.goddardai.org/platform/linux-gtk#text-entry)
describes the current scope.
