# Publish a Web app

ID: web-deployment
Targets: web
Related APIs: pnpm build, vite preview, xplatWeb, @octane-xplat/cli/vite

## Starting point

A created Octane-xplat app that runs locally. The app owner has a static host
and controls its build, HTTPS, routing and cache settings.

## Requirements

- Build and preview the production browser files.
- Publish the build with working assets and direct links to app screens.
- Keep already-open tabs usable across deployment updates.
- Verify the deployed app against its browser, accessibility and service targets.

## Acceptance criteria

- AC1: The reader can lint, typecheck, build and preview the created app, and distinguish the built preview from the development server.
- AC2: The reader can publish the build output over HTTPS and configure navigation fallback without serving HTML for missing JavaScript, CSS or worker files.
- AC3: The reader can choose HTML/asset cache behavior and preserve assets required by already-open tabs when publishing an update.
- AC4: The reader can check direct links, reload, Back/Forward, main actions and keyboard navigation on the published address, and identify browser/device, assistive-technology and configured-service checks that local framework CI does not qualify.

## Documentation

- AC1: [Preview and publish Web](../docs/start/toolchain.md#preview-and-publish-web), the maintained [starter scripts](../packages/create/template/package.json) and [Web config](../packages/create/template/vite.config.ts), and the [packed-consumer verifier](../scripts/verify-consumer.mjs).
- AC2: [Host output, HTTPS and navigation](../docs/start/toolchain.md#preview-and-publish-web); the [production browser smoke](../apps/web/scripts/smoke.mjs) exercises direct screen links locally. The app's host configuration needs its own deployment check.
- AC3: [Cache and deployment updates](../docs/start/toolchain.md#preview-and-publish-web). No configured public-host deployment is qualified by the repository's local checks.
- AC4: [Published-site checks](../docs/start/toolchain.md#preview-and-publish-web), [Web support boundary](../docs/start/spec.md#choose-your-targets), [input evidence](../docs/notes/input-readiness-notes.md), and [optional service qualification](../docs/notes/optional-service-qualification.md).
