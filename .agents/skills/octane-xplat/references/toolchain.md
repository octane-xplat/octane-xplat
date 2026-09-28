# Toolchain

## Builds

```sh
# web — production dist (what pnpm smoke tests)
cd apps/web && pnpm exec vite build

# iOS — debug / release (simulator, unsigned OK)
cd apps/mobile && pnpm exec ns build ios
cd apps/mobile && pnpm exec ns build ios --release     # Release-iphonesimulator

# Android — debug / signed release
cd apps/mobile && pnpm exec ns build android
cd apps/mobile && pnpm exec ns build android --release \
  --key-store-path <keystore> --key-store-password <pw> \
  --key-store-alias <alias> --key-store-alias-password <pw>
```

The web production build is covered by the smoke script (34 assertions at
this revision).

## The publish model (`@octane-xplat/ui`)

Ships **compiled** output, not .tsrx source:

- `packages/ui/vite.config.ts` — lib mode + `preserveModules`, run twice
  (`vite build`, `vite build --mode native`) → `dist/web`, `dist/native`.
  Suffix chain resolved at build; hooks retarget to
  `@nativescript-community/octane`; runtime deps external via peers.
- `exports` point at `src` for workspace dev; `publishConfig` swaps to
  `dist` (+ `types` condition) only at publish — verified via `pnpm pack`.
- **Types:** `src/props.ts` (pure .ts) → `tsc -p tsconfig.types.json
  --emitDeclarationOnly` → `types/props.d.ts`; the web, native, and
  platform-subpath declaration files are thin shells around those props.
  Published root types are split by web/native export condition. tsrx cannot
  emit declarations for `.tsrx` files itself (upstream tsrx#136).

## Publish procedure

```sh
cd packages/ui
pnpm version minor --no-git-tag-version   # or patch
git add package.json && git commit -m "chore(ui): release X.Y.Z"
pnpm publish --access public              # needs npm login; OTP prompts
```

pnpm publish refuses dirty trees and needs an interactive terminal for
OTP/2FA — run it manually, not through an agent.

## Version pins (deliberate)

octane 0.5.0, @nativescript-community/octane 0.2.1, @nativescript/core
9.1.2, vite 8.3.0, @octanejs/vite-plugin 0.1.60, tsrx toolchain pinned.
Beta/fast-moving deps stay exact-pinned — bump deliberately.

## pnpm workspace specifics

- `nodeLinker: isolated` in pnpm-workspace.yaml — NativeScript's vendor
  manifest and HMR code read package manifests from the app root, so every
  package and app must declare its imports (including NativeScript plugins
  shipped by an app).
- `minimumReleaseAgeExclude` covers the octane packages (newer than the
  supply-chain cutoff).
- `pnpm install` auto-fetches peers — workspace deps must say
  `"workspace:*"`.
