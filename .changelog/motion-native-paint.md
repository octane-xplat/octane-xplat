### Preserve native paint through layout projection

Native layout projection now uses a Mason-owned paint handle to preserve authored radii and shadows through correction and cleanup. The framework now depends on Mason core `1.0.0-beta.9`, which publishes this JavaScript API and numeric-radius readback fix; no Swift/Kotlin engine update is needed.

[Layout animation documentation](https://octane-xplat.goddardai.org/animation-gestures#keep-corners-steady-while-a-card-expands)
