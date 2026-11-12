### Share reduced-motion observation across Motion components

Motion components now share one system-preference observer per runtime. Android uses one polling timer and one resume listener while readers are mounted, then releases both when the last reader leaves.

[Motion lifecycle documentation](https://octane-xplat.goddardai.org/animation-gestures#reduced-motion-and-lifecycle)
