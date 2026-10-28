# @octane-xplat/web-host

Optional Web rendering over Xplat's existing route catalog. See
[the Web rendering guide](https://octane-xplat.goddardai.org/web-rendering) for the Fetch
handler, explicit public data transfer, component-authored documents, HTML
templates and browser startup.

In an existing Xplat app, install the package, then follow the guide to add
server rendering:

```sh
pnpm add @octane-xplat/web-host
```

To try the [maintained example](https://github.com/octane-xplat/octane-xplat/blob/main/packages/web-host/example/build.mjs),
run these commands from a framework checkout. It builds separate server and
browser entries, then starts a local server:

```sh
pnpm exec turbo run build:example --filter=@octane-xplat/web-host
node packages/web-host/example/serve.mjs
```
