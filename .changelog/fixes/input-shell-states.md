### Text fields get the Astryx hover and focus rings on web

`TextInput` and `TextArea` shells now match upstream's input chrome:
hover draws a 2px inset ring at 30% of the border color, and focusing
the field swaps the border to `--color-accent` with an inset
`--color-accent-muted` ring — including the status variants, which keep
their status border and answer hover with their own inset shadows. The
ring moves from the inner text leaf's 1px outline to the field's
bordered box, so the focus indicator frames the whole control. Bare
`TextInput` leaves outside a bordered shell (for example inside menus)
keep their thin focus outline.
