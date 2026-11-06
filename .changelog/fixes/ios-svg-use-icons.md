### Paint iOS SVGs built from `<use>` icon references

On iOS, SVG artwork that stamps a shared shape with `<use>` (the defs-plus-use pattern common in exported icon sets) produced correctly sized views with parsed geometry but no paint — icons came out invisible while equivalent inline paths rendered. The SVG pipeline now expands `<use>` references into their generated content before the native renderer parses the markup, so use-based icons paint with their own fill, stroke, filter, transform, and x/y positioning on iOS.

[Image component](https://octane-xplat.goddardai.org/package-ui#image)
