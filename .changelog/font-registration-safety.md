### Preserve font registration data

Font registration now validates its complete changes before writing. Invalid
saved `fonts.json` data produces an error instead of being discarded; repair
that file before retrying.

**Breaking change:** each font input, converted font, or managed output is limited
to 16 MiB, and one registration plan is limited to 32 MiB. Choose smaller font
files or a Fontsource subset, and register large collections in separate calls.

```sh
bun run xplat fonts add @fontsource/roboto --subset latin --weights 400,700 --install
```

See the [CLI guide](https://octane-xplat.goddardai.org/package-cli).
