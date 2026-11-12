### Preserve native paint through layout projection

Native layout projection now uses a Mason-owned paint handle to preserve authored radii and shadows through correction and cleanup. The framework’s Mason beta.8 patch supplies this JavaScript API; no Swift/Kotlin engine update is needed.

[Layout animation documentation](https://octane-xplat.goddardai.org/animation-gestures#keep-corners-steady-while-a-card-expands)
