### Handle hardware keys in native macOS leaves

The experimental AppKit `useKeyboard` hook now attaches normalized key-down/up
handlers to native intrinsics. It routes from the first responder through
registered native ancestors, supports cancellation and propagation, and
coordinates Tab handling with FocusScope. Real OS input and IME remain
unqualified. Modifier-only changes and extended physical-key mappings remain
explicit limits.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useKeyboard } from '@octane-xplat/ui'

export function SearchField() {
  const keys = useKeyboard({ onKeyDown: (event) => {
    if (!event.isComposing && event.metaKey && event.key.toLowerCase() === 'k') {
      event.preventDefault()
    }
  } })
  return <textfield accessibilityLabel="Search" {...keys.keyboardProps} />
}
```

[Keyboard documentation](https://octane-xplat.goddardai.org/app/keyboard-clipboard#handle-hardware-keys-on-appkit)
