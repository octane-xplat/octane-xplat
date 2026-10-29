### Add multiline fields to GTK screens

The GTK UI root now exports TextArea and TextAreaProps for labeled multiline
fields, row sizing, capped growth and leading icons. The renderer supports
its textview intrinsic for
multiline text, placeholder hints, read-only editing, focus and change events. Long text scrolls
inside its assigned height, including read-only editors. Explicit width and
height stay fixed as text wraps; clearing them restores automatic sizing.
Replacing selected text reports one completed change. Use maxLength to limit
newly typed or pasted text. Text and placeholder alignment follow textAlign.
Return adds a line;
done/send can submit instead. Tab moves to the next control.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function NotesEditor() {
  return (
    <textview
      text={'A line\n'.repeat(20)}
      hint="Write a note"
      maxLength={200}
      accessibilityLabel="Notes"
      onTextChange={(event) => console.log(event.value)}
      style={{ width: 260, height: 120, textAlign: 'start' }}
    />
  )
}
```

Import the field from the same package as other shared controls.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { TextArea } from '@octane-xplat/ui'
export function Notes() {
  return <TextArea label="Notes" defaultValue="" rows={3} autoGrow maxRows={6} />
}
```

[GTK text entry](https://octane-xplat.goddardai.org/platform/linux-gtk#multiline-fields)
describes the supported behavior and runtime limits.
