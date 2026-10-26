### Headings render the Astryx type scale

`Heading` now applies the theme's `--text-heading-*` tokens — size, weight,
and line-height for levels 1–6 — on web, iOS/Android, and macOS. Previously
web fell back to browser defaults (32px bold h1, 24px bold h2) with no
line-height, and body text had no Astryx leading.
