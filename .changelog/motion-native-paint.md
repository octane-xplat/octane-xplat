### Preserve native paint through layout projection

Native layout projection now uses a Mason-owned paint handle to preserve authored radii and shadows through correction and cleanup. This JavaScript API and numeric-radius readback fix ship in Mason core `1.0.0-beta.9` and later; no Swift/Kotlin engine update is needed.

[Layout animation documentation](https://octane-xplat.goddardai.org/animation-gestures#keep-corners-steady-while-a-card-expands)
