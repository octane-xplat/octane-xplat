### Follow the display refresh rate in native macOS animations

Native macOS Motion, imperative UI animations and CSS keyframes now share display-synchronized scheduling instead of 16 ms timers. The scheduler stops when idle and uses monotonic time so system clock changes do not affect animation progress. macOS 13.5 remains supported. Rebuild the native host after upgrading; see [animation guidance](https://octane-xplat.goddardai.org/app/animation-gestures).
