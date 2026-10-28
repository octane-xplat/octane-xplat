### Add a multiline editor to GTK screens

The experimental GTK renderer now supports the textview intrinsic for
multiline text, placeholder hints, read-only editing, focus and change events. Long text scrolls
inside its assigned height, including read-only editors. Explicit width and
height stay fixed as text wraps; clearing them restores automatic sizing. Return adds a line;
done/send can submit instead. Tab moves to the next control.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function NotesEditor() {
  return (
    <textview
      text={'A line\n'.repeat(20)}
      hint="Write a note"
      accessibilityLabel="Notes"
      onTextChange={(event) => console.log(event.value)}
      style={{ width: 260, height: 120 }}
    />
  )
}
```

The public TextArea component still needs maximum-length, text-alignment and
full field qualification. [GTK text entry](https://octane-xplat.goddardai.org/platform/linux-gtk#text-entry)
describes the current scope.
