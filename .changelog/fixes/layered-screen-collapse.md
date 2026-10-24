---
release: lockstep
---

### Keep layered screens responsive when text collapses

On iOS, measuring or requesting layout in a layered `Screen` containing
collapsed `Text` no longer causes a repeating layout loop. Timers continue
running as the text changes between collapsed, hidden, and visible states.

Rebuild the native app after upgrading to load the corrected engine.

[Screen layers](https://octane-xplat.goddardai.org/primitives#layer-a-screen-over-retained-content)
