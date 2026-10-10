# @octane-xplat/updates

Optional OTA JavaScript and asset updates for iOS and Android **release builds**.
Updates activate at the next cold launch. Native startup restores the backup
on the following launch if the app never confirms successful startup.

See the [setup and recovery guide](../../docs/app/updates.md). This package is
new in the repository; npm publication and the first trusted-publisher setup
remain release prerequisites.

```ts
import { createUpdates } from '@octane-xplat/updates'

export const updates = createUpdates({
	endpoint: 'https://updates.example.com',
	embeddedVersion: '1.0.0',
	channel: 'stable',
})
```

The client is optional. Web, desktop and debug/LiveSync builds report
`supported: false`; check that before doing update work.

```ts
import { updates } from './updates'

export async function afterSuccessfulStartup() {
	if (!updates.supported) return
	updates.markHealthy()
	const result = await updates.check()
	if (result.available) await updates.install(result.manifest)
}
```

The endpoint must be HTTPS. Archive limits default to 32 MiB downloaded and
128 MiB expanded. Installation checks the archive SHA-256, size, paths, entry
point and minimum native version. Bundles are **not signed**: the configured
server and its TLS connection are trusted. Native dependencies and permissions
still require a binary release. Automatic native-compatibility fingerprinting
and signed physical iOS device qualification remain gaps.
