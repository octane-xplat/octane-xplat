# @octane-xplat/web-host

Optional Web rendering over Xplat's existing route catalog. See
[the Web rendering guide](../../docs/platform/web-rendering.md) for the Fetch
handler, explicit public data transfer, component-authored documents, HTML
templates and browser startup.

The [maintained example](example/build.mjs) builds separate server and browser
entries. From a framework checkout:

```sh
pnpm exec turbo run build:example --filter=@octane-xplat/web-host
node packages/web-host/example/serve.mjs
```
