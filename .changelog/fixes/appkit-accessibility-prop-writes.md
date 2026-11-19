### macOS accessibility props reach plain AppKit views

`accessibilityLabel`, `accessibilityHint`, `accessible`, and `accessibilityState.disabled` now apply on labels, buttons, scroll views, and text inputs. The renderer previously called `setAccessibility*` methods the bridge never exposes, so the writes silently did nothing — including the enabled flag that gates `focus()` on multiline text areas.

See [accessibility](https://octane-xplat.goddardai.org/accessibility).
