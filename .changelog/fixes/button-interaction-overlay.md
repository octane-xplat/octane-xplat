### Buttons paint the Astryx hover and pressed overlays on web

`Button` — and every component built on it, like `ToggleButton` and
`DropdownMenu` triggers — now answers pointer hover with the
`--color-overlay-hover` wash and a press with `--color-overlay-pressed`,
layered over the variant's own fill like upstream's interaction overlay.
Previously web buttons showed no hover or pressed feedback at all.
Disabled and aria-disabled buttons stay inert.
