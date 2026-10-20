# AGENTS.md

Octane Xplat app — one TypeScript codebase for web + iOS + Android (Octane

- NativeScript).

Before writing code, read `.agents/skills/xplat/SKILL.md` (or invoke the
`xplat` skill). Its invariants are enforced by `pnpm lint` — violations
usually still compile but silently break on one platform.

## Framework versions

Keep framework/compiler/native tool pins in the supplied `catalog:xplat`.
Upgrade the version set and patches together, then run the app's checks.
Within a multi-package workspace, upgrade covers all packages. Preserve
app-specific dependencies and reconcile custom-patch conflicts before retrying:

```sh
pnpm dlx @octane-xplat/cli@latest upgrade --check
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm xplat doctor
pnpm typecheck
```

## JSX types

The app's `tsconfig.json` selects shared native JSX types. Browser JSX leaves
select DOM types on their first line; keep runtime imports from `octane`:

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
export function BrowserMessage() {
	return <p>Ready</p>
}
```

Native leaves can explicitly select the same default with
`/** @jsxImportSource @octane-xplat/jsx */`. Do not replace it with a renderer
pragma. The facade supplies types; Vite still selects the platform renderer.

## App testing

The starter includes managed runners, sample tests, configuration, and scripts
for its enabled platforms. Adapt the samples to the app and run the relevant
commands:

```sh
pnpm test:web
pnpm test:ios -- --device DEVICE_UDID
pnpm test:android -- --device DEVICE_SERIAL
```

Only commands for enabled platforms are added. Web tests use jsdom; phone
tests need a selected simulator or device. Report targets actually run and
distinguish document checks from browser layout or OS input checks. See the
[testing guide](https://octane-xplat.goddardai.org/testing#add-automated-tests).

## Stable automation targets

```tsx
import { Button } from '@octane-xplat/ui'

export function AddItem() {
	return <Button testID="packing.add-item" label="Add item" accessibilityLabel="Add item" />
}
```

Assign optional semantic `testID` names to meaningful controls and asserted
state as you build: `packing.add-item`, `profile.name`,
`packing.item.${item.key}.open`. Keep names unique among mounted targets,
stable across localization, and based on durable repeated-item keys rather
than array positions. Preserve `id` values, useful accessibility labels and
roles. Do not put IDs on every decorative child or expose personal data.
Inputs target their editable host; overlays target mounted content. Verify
forwarding when composing another component; inherited types alone do not
promise platform support. See [qualified hosts and mappings](https://octane-xplat.goddardai.org/test-identifiers).

Argent is optional AI-agent device/browser control through MCP, with no app
runtime dependency. Use [official setup](https://docs.swmansion.com/argent/docs/fundamentals/installation/)
and the [qualified local recipe](https://octane-xplat.goddardai.org/argent)
(version 0.27.0). Prefer stable IDs for reliable targeting while keeping
spoken accessibility semantics. Discovery and replay have different native
prerequisites. Chromium prefers DOM `id` over `data-testid` when both exist.
The recipe states the actual iOS/Android/Chromium scope and limits; do not
infer AppKit, physical-device, or arbitrary typing support.
