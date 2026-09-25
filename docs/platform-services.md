# Using device features

> Ask the platform service for a capability instead of calling browser or
> native APIs from a screen.

## The shared service shape

Services have the same name on every platform. For example, a screen can use
storage without knowing whether the value lives in browser storage or a native
database:

```ts
import { storage } from '@octane-xplat/platform'

storage.setString('has-seen-welcome', 'true')
const seen = storage.getString('has-seen-welcome')
```

Other services cover permissions, clipboard, sharing, haptics, files, media
picking, notifications, safe-area insets, screen size, and app lifecycle.

## Capability map

| Service              | Shared shape                                          | Web leaf                                                                                                        | Native leaf                                                                                 | Evidence                                       |
| -------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `geolocation`        | `Capability<GeolocationImpl>`; `getCurrentPosition()` | `navigator.geolocation`                                                                                         | `@nativescript/geolocation`: `enableLocationRequest()` + `getCurrentLocation()`             | iOS sim verified; Android timed out (device env) |
| `connectivity`       | `getState()` + `subscribe(listener)`                  | `navigator.onLine` and `online`/`offline` events; connection information when `navigator.connection` exposes it | NativeScript core `Connectivity` (`getConnectionType`, `startMonitoring`, `stopMonitoring`) | iOS sim + Android device                                    |
| `appInfo`            | `{ supported, version, build, bundleId }`             | unsupported; browser bundles have no trustworthy app identity                                                   | Android package metadata; iOS `NSBundle` metadata                                           | Android cold-launch verified                                |
| `openUrl(url)`       | returns whether an outbound link was opened           | `window.open`                                                                                                   | `Utils.openUrl`                                                                             | Android device; iOS pending                                 |
| `openSettings`       | `Capability<OpenSettingsImpl>`                        | unsupported                                                                                                     | per-app iOS Settings URL or Android application-details intent                              | Android device; iOS pending                                 |
| `media.pickImage()`  | existing single-image contract                        | image file input                                                                                                | `@nativescript/imagepicker` single mode                                                     | Android device; iOS pending                                 |
| `media.pickImages()` | `Promise<PickedImage[]>`                              | image file input with `multiple`                                                                                | `@nativescript/imagepicker` multiple mode                                                   | desk-source                                                 |
| `media.capturePhoto()` | `Promise<PickedImage \| null>`                     | `<input type="file" capture>` — mobile browsers open the camera UI, desktop falls back to the file picker       | `@nativescript/camera`: `takePicture()` (UIImagePickerController on iOS, `ACTION_IMAGE_CAPTURE` on Android) | desk-source |

`media` owns the `camera` and `photos` permission requests. On native,
`ensure('camera')` checks hardware with `isAvailable()` (`unsupported` on the
iOS simulator) and requests access with `requestCameraPermissions()`; on web
it probes `getUserMedia`. Photo-library selection needs no separate browser
prompt, and the native imagepicker owns photo-library access.
`permissions.ensure(kind)` delegates to the owning service for notifications,
media, and location rather than maintaining a second set of probes.

Camera capture is stills-only — no maintained NativeScript video-capture
plugin exists, so the contract has no `captureVideo`. On web,
`capturePhoto`'s `capture` attribute asks the browser for the camera, which
is a real camera flow on phones but a file-picker fallback on desktops;
`width`/`height`/`keepAspectRatio`/`saveToGallery` are native-only options.
Apps calling `capturePhoto` must declare `@nativescript/camera` (doctor flags
it) and set `NSCameraUsageDescription` — plus `NSPhotoLibraryAddUsageDescription`
when using `saveToGallery` — in their iOS `Info.plist`.

NativeScript plugins must be declared by the app that ships them as well as by
this package. In particular, add `@nativescript/geolocation` to the native
app's dependencies; `/ns/m` resolves plugin specs under the app root, so a
transitive dependency of `@octane-xplat/platform` is not enough. Connectivity
is provided by `@nativescript/core` and does not need a separate plugin.

## Optional capabilities

Some features are not available everywhere. Check support and ask for access
before using the implementation:

```ts
import { permissions } from '@octane-xplat/platform'

const result = await permissions.ensure('camera')
if (result === 'granted') console.log('start camera')
else console.log('camera unavailable')
```

Your screen should show a useful fallback when a capability is unavailable or
the user declines it.

## Interface shapes

The shared contracts are deliberately small and platform-neutral:

```ts
interface GeolocationImpl {
	getCurrentPosition(options?: {
		enableHighAccuracy?: boolean
		timeout?: number
		maximumAge?: number
	}): Promise<{
		latitude: number
		longitude: number
		accuracy: number
		altitude: number | null
		heading: number | null
		speed: number | null
		timestamp: number
	}>
}

type ConnectionType = 'none' | 'wifi' | 'mobile' | 'ethernet' | 'bluetooth' | 'vpn' | 'unknown'

interface ConnectivityImpl {
	getState(): { online: boolean; type: ConnectionType }
	subscribe(listener: (state: { online: boolean; type: ConnectionType }) => void): () => void
}

interface OpenSettingsImpl {
	open(): boolean
}

interface MediaImpl {
	pickImage(): Promise<PickedImage | null>
	pickImages(): Promise<PickedImage[]>
	capturePhoto(options?: CapturePhotoOptions): Promise<PickedImage | null>
	ensure(kind: 'camera' | 'photos'): Promise<'granted' | 'denied' | 'unsupported'>
}
```

`appInfo` uses nullable fields with `supported: false` on web instead of
inventing a version from the browser bundle. `openSettings` is a capability so
web consumers can check support without a thrown error. Verified on device:
connectivity and direct file reads on both targets, settings and URL intents
on Android, location on iOS. OS-mediated UI — pickers, permission prompts,
share sheets — still needs live validation.

## Keep platform code at the edge

Do not import `navigator`, `document`, NativeScript classes, or OS-specific
plugins into a shared screen. If the service does not exist yet, add its
shared contract and web/native leaves rather than adding a one-off conditional.

See the [platform notes](platform-notes.md) for the complete capability map,
accessibility mapping, and native typing details.
