### Format source with the experimental native CLI

The parallel Nim CLI can format regular source and TSRX on macOS Apple Silicon.
Install the formatter in your project and provide Node >=22.22.2. Check mode
leaves files untouched; configuration or parse errors prevent all source writes.
The native download includes neither Node nor the formatter engine.

```sh
bun add --dev @octane-xplat/fmt@0.1.1
xplat fmt src --check
xplat fmt src
```

This applies to the experimental `nim` channel. See
[native CLI setup](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable).
