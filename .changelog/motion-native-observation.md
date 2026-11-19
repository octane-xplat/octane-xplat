### Share the reduced-motion setting across animations

Mounted Motion components share one watcher for the system’s reduced-motion setting. On Android this replaces polling from each component with one shared timer, which stops when the last reader unmounts.

[Reduced motion and lifecycle](https://octane-xplat.goddardai.org/animation-gestures#reduced-motion-and-lifecycle)
