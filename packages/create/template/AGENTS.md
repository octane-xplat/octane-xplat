# AGENTS.md

Octane Xplat app — one TypeScript codebase for web + iOS + Android (Octane

- NativeScript).

Before writing code, read `.agents/skills/xplat/SKILL.md` (or invoke the
`xplat` skill). Its invariants are enforced by `pnpm lint` — violations
usually still compile but silently break on one platform.

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
promise platform support. See [qualified hosts and mappings](https://octane-xplat.goddardai.org/verify/test-identifiers).

Argent is optional AI-agent device/browser control through MCP, with no app
runtime dependency. Use [official setup](https://docs.swmansion.com/argent/docs/fundamentals/installation/)
and the [qualified local recipe](https://octane-xplat.goddardai.org/verify/argent)
(version 0.27.0). Prefer stable IDs for reliable targeting while keeping
spoken accessibility semantics. Discovery and replay have different native
prerequisites. Chromium prefers DOM `id` over `data-testid` when both exist.
The recipe states the actual iOS/Android/Chromium scope and limits; do not
infer AppKit, physical-device, or arbitrary typing support.
