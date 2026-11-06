### Draw SVGs revealed after a collapsed parent on iOS

On iOS, an SVG glyph (Icon, Image, Meter) mounted under a parent toggling `visibility: collapse` to `visible` stayed blank: the view gained valid bounds and kept its parsed paths, but its layer never received backing contents. The view now requests display when it gains positive bounds or its visibility is restored, so revealed SVGs render their artwork.

[Icon component](https://octane-xplat.goddardai.org/package-ui#icon)
