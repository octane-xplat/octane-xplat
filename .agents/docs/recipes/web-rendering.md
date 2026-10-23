# Serve Web routes as HTML

ID: web-rendering
Targets: web
Related APIs: createWebHandler, startWebApp, Document, RouteOutlet, createRoutePreparation

## Starting point

An executable Xplat route catalog, Octane 0.14 or newer, and a Web HTTP host.
The app owner can compile and deploy separate server and browser entries.

## Requirements

- Send request-local HTML and hydrate its initial route without duplicate preparation.
- Choose a component-authored document or an existing HTML template.
- Transfer only declared public data and preserve HTTP failures and redirects.
- Keep web rendering choices separate from live/baked route data.

## Acceptance criteria

- AC1: The reader can build the maintained example, connect the Fetch handler, and hydrate the same catalog with matching build and asset identifiers.
- AC2: The reader can author a document or template, distinguish server-only shell state from interactive app state, and retain the normal router for later navigation.
- AC3: The reader can project public data, keep private services out of rendering and transfer, handle HTTP outcomes, and select explicit cache behavior.
- AC4: The reader can choose server or client rendering per request and identify the separate native, streaming, server-code-boundary and static-generation scope.

## Documentation

- AC1: [Web rendering guide](../../../docs/platform/web-rendering.md#try-the-maintained-example), [build example](../../../packages/web-host/example/build.mjs), [srvx server](../../../packages/web-host/example/serve.mjs).
- AC2: [Document and app shell](../../../docs/platform/web-rendering.md#author-the-whole-document), [hydration regression](../../../packages/web-host/test/host.test.mjs).
- AC3: [Public projection](../../../docs/platform/web-rendering.md#choose-what-reaches-the-screen-and-browser), [HTTP and cache behavior](../../../docs/platform/web-rendering.md#mix-server-and-client-rendering).
- AC4: [Rendering mode and limits](../../../docs/platform/web-rendering.md#mix-server-and-client-rendering), [implementation evidence](../notes/web-rendering-host.md).
