# @octane-xplat/fingerprint

Compare the native build inputs of two Octane Xplat apps before sending a
JavaScript update. A fingerprint is a SHA-256 identity plus a list of hashed
inputs. The API follows [Expo Fingerprint](https://docs.expo.dev/versions/latest/sdk/fingerprint/)
names while collecting NativeScript inputs instead of Expo or React Native inputs.

This is a **Node build tool**, not an app runtime module. Install it in your
app's development dependencies with Node 22.22.2 or newer and Bun:

```sh
bun add -D @octane-xplat/fingerprint
bun run xplat-fingerprint --dir . --platform ios > native-inputs.json
```

The command prints JSON containing `hash` and `sources`. Compare it after a
change; each difference names an added, removed or changed input. Ordinary
app JavaScript changes do not change the native identity.

```sh
bun run xplat-fingerprint --dir . --platform ios --diff native-inputs.json
```

## Use in a build script

Create `scripts/native-inputs.mjs` in the app. The same inputs in different
checkout directories produce the same hash. Source records contain paths,
reasons and hashes; they omit the configuration values and file contents.

```js
import {
	createFingerprintAsync,
	createProjectHashAsync,
	diffFingerprintChangesAsync,
} from '@octane-xplat/fingerprint'

const before = await createFingerprintAsync('.', { platforms: ['ios'] })
console.log(before.hash, before.sources.length)
console.log(await createProjectHashAsync('.', { platforms: ['ios'] }))
console.log(await diffFingerprintChangesAsync(before, '.', { platforms: ['ios'] }))
```

The defaults collect iOS and Android inputs together. Select a single platform
when comparing native binaries. Installed dependencies and a resolved Bun or pnpm
lockfile are required. Missing or ambiguous native dependency metadata fails
the operation rather than producing a compatibility claim.

```js
import { createFingerprintAsync, diffFingerprints } from '@octane-xplat/fingerprint'

const before = await createFingerprintAsync('.', { platforms: ['android'] })
const after = await createFingerprintAsync('.', { platforms: ['android'] })
console.log(diffFingerprints(before, after))
```

## Compare with an OTA binary

Follow [phone update setup](https://octane-xplat.goddardai.org/updates) to build
an OTA-enabled release. Its prepare hook captures compiler and SDK identity,
build mode, declared compiler overrides, native sources and resolved native
dependencies. The hook bakes the hash into native startup and saves a private
build record at `.xplat/fingerprints/ios.json` or `android.json`. Keep `.xplat/`
out of Git. Use that record to reproduce the build's compiler context on a
publishing machine; a source-only invocation has a different context.

```sh
bun run xplat-fingerprint --dir . \
  --build-record .xplat/fingerprints/ios.json \
  --diff .xplat/fingerprints/ios.json
```

An empty diff means the collected inputs still match. It does not prove that
arbitrary custom build steps are deterministic or that a payload is safe.
The OTA publisher checks the record automatically; native startup separately
rejects an incompatible staged payload before its JavaScript runs.

## Include a custom native input

Add `fingerprint.config.json` at the app root when a custom build step reads
an additional file. `extraSources` augments automatic collection; executable
fingerprint config files are unsupported. `ignorePaths` and `.fingerprintignore`
can exclude extra inputs, but excluding an automatic native input is an error.

```json
{
	"extraSources": [
		{
			"type": "file",
			"filePath": "native-options.json",
			"reasons": ["custom native generator input"]
		}
	],
	"toolchain": { "customGeneratorVersion": "1" }
}
```

The collector includes evaluated NativeScript configuration, custom resources,
declared `NativeSource` files, native plugin files and versions, relevant Bun or pnpm
resolutions and patches, hooks, native declarations and available Pod/SwiftPM/
Gradle lock records. It executes the app's trusted NativeScript configuration
as build code, including relative configuration helpers. Declare any extra
inputs those helpers consume. Symbolic links must stay within their declared
input root. Inspect the collected records when qualifying a custom build:

```js
import { createFingerprintAsync } from '@octane-xplat/fingerprint'

const fingerprint = await createFingerprintAsync('.', { platforms: ['ios'] })
for (const source of fingerprint.sources) console.log(source)
```

Source collection also accepts `macos`, `linux` and `windows` for build-tool
diagnostics. OTA activation remains iOS/Android only; there is no browser
runtime API. Apple compiler capture belongs on the Apple build host, and
Android compiler capture belongs on its configured SDK host. Android runtime
qualification is currently unverified. See the [implementation evidence](../../.agents/docs/notes/fingerprint.md)
for collector limits and platform verification.
