---
hype: 60
---

### Restore authored overflow control on SmoothCorners

`overflow: hidden` applied to `SmoothCorners` through a Bamboo-generated or
otherwise layered class now clips children to the curve as documented. A
framework stylesheet declared `overflow: visible` without a cascade layer, so
it outranked every layered authored rule on web and macOS and won by
stylesheet registration order on iOS and Android. The default now relies on
each platform's initial visible overflow, so authored classes — layered or
plain — always decide the clip. No app change is needed; remove any
specificity or `!important` workaround added for this issue.

See [clip an image or other content](https://octane-xplat.goddardai.org/package-smooth-corners#clip-an-image-or-other-content).
