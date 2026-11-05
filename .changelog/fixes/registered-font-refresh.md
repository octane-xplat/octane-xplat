### Refresh registered fonts when their source changes

Re-running font registration now refreshes an already registered font's bundled
file, web face, and referring tokens. Previously, it could report the new family
while keeping old font bytes. Conflicting files that were never registered are
preserved and produce an error instead of being overwritten.

```sh
bun run xplat fonts add ./downloads/AcmeSans-Variable.ttf
```

Fontsource registration also reports the imported CSS family as the web name,
while retaining the font's internal names for iOS.

```sh
bun run xplat fonts add @fontsource-variable/inter --install
```

See [font-family tokens](https://octane-xplat.goddardai.org/styling#font-family-tokens).
