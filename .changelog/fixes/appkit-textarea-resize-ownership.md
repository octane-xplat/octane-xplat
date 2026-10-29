### Keep AppKit text-area resizing with the current field

AppKit TextArea resize observers now retire before their editor is removed.
Late callbacks and sizing that loses its native owner stop before later frame
writes. Growth, row caps and the full scrollable document keep their existing
behavior.

```tsx
import { TextArea } from '@octane-xplat/ui'
export function Notes() {
  return <TextArea label="Notes" autoGrow rows={2} maxRows={4} />
}
```

Source cases remain unrun; real native resizing, scrolling, cleanup and installed-
app qualification remain pending. See [AppKit growth ownership](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/primitives.md#keep-appkit-growth-with-its-editor).
