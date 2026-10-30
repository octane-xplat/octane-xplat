### Fix AppKit GridList stack direction

AppKit `GridList` now places rows vertically with `layout="stack"`. Previously,
full-width rows stayed in a horizontal flex container.
