### Web apps get the Astryx font smoothing

The shared web normalization now applies
`-webkit-font-smoothing: antialiased` and
`-moz-osx-font-smoothing: grayscale` to the document body, matching
upstream's `reset.css`. Text renders slightly lighter — the same weight
the Astryx themes are designed around — instead of the DOM's heavier
subpixel default.
