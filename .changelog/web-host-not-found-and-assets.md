---
hype: 60
---

### Link hashed build assets and render a not-found page on the web host

`@octane-xplat/web-host` gains `manifestAssets`, which turns a Vite `build.manifest` entry into the renderer's script and stylesheet list — hashed files change URL with each build, and CSS imported by the client entry reaches pages read without JavaScript.

```ts
const assets = manifestAssets(manifest, 'src/client.web.ts')
```

`prerender` gains `notFound`, which renders a public 404 page into `404.html` — the file static hosts serve for unmatched URLs — and marks it as a fallback document; `startWebApp` hydrates it at its own URL and swaps in the real page everywhere else.

The `document` assembly hook takes an optional `{ fallback: true }` and the `prerender` result reports `notFound` — both additions to existing signatures, not breaking changes.

See [Web rendering](https://octane-xplat.goddardai.org/web-rendering).
