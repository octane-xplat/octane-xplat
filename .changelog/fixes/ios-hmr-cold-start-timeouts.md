### Start large iOS apps with live updates on a cold dev server

On a fresh dev server, large iOS apps could stall at startup while the server prepared big dependency files, and the app gave up after repeated request timeouts. The managed `@nativescript/vite` patch now reads imports with Vite's faster parser, so the first launch finishes. Some requests can still be retried while the server warms up.

```sh
bun run xplat dev ios
```

[CLI guide](https://octane-xplat.goddardai.org/package-cli)
