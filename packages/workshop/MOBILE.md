# Try a component in the mobile workshop

The mobile workshop opens your stories in a separate NativeScript development
entry. Its iOS and Android adapters are implemented and compiled, but **neither
host is qualified yet**. Actual touch, keyboard, screen-reader, IME, reload and
cleanup checks are still required before claiming mobile support.

## Prepare your existing app

Use an app that already runs Octane Xplat on iOS or Android. Keep its existing
framework versions, NativeScript resources, styles and plugins. Install the
workshop as a development dependency, then create a local counter story:

```sh
pnpm add -D @octane-xplat/workshop
pnpm exec xplat workshop init
```

Wrap the result of your existing native Vite configuration with
`withWorkshopMobile`. This preserves your renderer settings and plugins and
places the workshop's reload hook before Octane's hook. In a standard scaffold,
edit `vite.config.native.mts` like this; retain your app-specific options:

```ts
import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'
import { withWorkshopMobile } from '@octane-xplat/workshop/vite-mobile'

export default defineConfig(async ({ mode }) =>
  withWorkshopMobile(await xplatNative(mode)),
)
```

Your ordinary app entry remains the production entry. The wrapper does nothing
unless the workshop launcher supplies a mobile target. Keep stories outside
production imports; check your production bundle rather than relying on their
filename alone.

```sh
# Your existing production build remains unchanged.
pnpm exec ns build android
```

## Select one real host

Run Doctor inside the app. It reads package/configuration and SDK-directory
prerequisites without booting a device. `unqualified-backend` means the launch
setup is present, not that a host acceptance check passed. SDK-directory checks
are preliminary; the NativeScript launch reports invalid SDK/toolchain setup.

```sh
pnpm exec xplat workshop doctor --json
pnpm exec xplat workshop list --target ios
pnpm exec xplat workshop list --target android
```

When you are authorized to use an actual host, supply its device ID explicitly.
iOS requires a macOS/Xcode host; Android requires a configured Android SDK and
compatible Java installation. The launcher uses the app's installed NativeScript
CLI and development-session reload loop. Replace the sample IDs below with the
IDs of your authorized devices; NativeScript may start the selected device.

```sh
pnpm exec xplat workshop dev --target ios --device YOUR_IOS_DEVICE_ID --story workshop/counter-basic
pnpm exec xplat workshop dev --target android --device YOUR_ANDROID_DEVICE_ID --story workshop/counter-basic
```

Select **Workshop / Counter**, then press **Increment**. Open **Controls**, edit
`step`, and press **Apply step**. Closing the panel returns to the same story.
**Reset** rebuilds its props, store and fixture from defaults. Save a story or
component to request a fresh revision. A failed edit keeps the previous stage
marked **STALE**; correcting the source requests another revision.

```ts
// Source edit in the story created by init:
args: { step: 2 },
```

## Providers, styles and story collections

The shared authoring contract is still version 1. Use the same story IDs,
controls, fixture cancellation and cleanup as described in the
[package guide](README.md). Global providers are configured in the consumer's
workshop configuration and wrap story-specific providers in declaration order:

```ts
import { defineWorkshopConfig } from '@octane-xplat/workshop'
export default defineWorkshopConfig({
  providerModules: ['./src/demo-providers.tsrx'],
  stories: { include: ['src/**/*.stories.tsrx'] },
})
```

The workshop preserves the native build configuration, but does not execute your
production entry's side effects. Import app styles and initialize required
plugins in a development provider module. Provider and story components need
the consumer's matching NativeScript compiler rules. Collections outside
`src/**` or workspace `packages/**` need explicit renderer inclusion:

```ts
import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'
import { withWorkshopMobile } from '@octane-xplat/workshop/vite-mobile'
export default defineConfig(async ({ mode }) => withWorkshopMobile(
  await xplatNative(mode, {
    rules: [
      { include: 'src/**/*.{ts,tsx,tsrx}', exclude: '**/*.web.*', renderer: 'nativescript' },
      { include: 'stories/**/*.{ts,tsx,tsrx}', exclude: '**/*.web.*', renderer: 'nativescript' },
    ],
  }),
))
```

## Qualification limits

The shell keeps a single attached stage while switching phone, compact and wide
layouts. Controls use explicit Apply actions to avoid applying unfinished text
composition. NativeScript buttons, text fields and scroll views provide the shell
surfaces; accessible names and Android panel Back handling are implemented.
Their actual accessibility, focus return, keyboard visibility, safe areas and
IME behavior remain unverified. Hardware Escape handling is not implemented yet.

The native adapter reuses the pinned portable Storybook composition subset and
the shared session's preparation/disposal core, then mounts compiler-produced
Octane components. The mobile Vite wrapper lowers Unicode-property regexes for
the pinned native runtimes. Actual-host composition and compatibility
qualification remain open. Browser manager/addon UI is excluded; the web
adapter and private visual harness are unchanged.

Native process crashes require a target restart. Module globals, permissions and
external application resources are outside the story subtree; authors must
register owned cleanup or use process-restart isolation. No runtime result,
visual parity, or six-target completion is claimed by the source/packed checks.
