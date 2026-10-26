### Route-change focus ring and stray toast-layer box removed

On web, navigating to a page moves focus to its heading for screen readers —
that scripted focus no longer paints a browser focus outline on the heading.
Keyboard focus rings on interactive elements are unchanged.

The empty toast layer no longer leaves a full-width strip at the top of the
page: its top-layer viewport now sits inside zero-footprint
`display: contents` wrappers and anchors to the configured edge, matching the
Astryx markup. Toast announcements flow through the shared document-level
live regions instead of per-viewport nodes.
