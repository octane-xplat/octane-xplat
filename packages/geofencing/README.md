# @octane-xplat/geofencing

Listen for a device entering or leaving a circular region on iOS or Android.
Use [geolocation](https://github.com/octane-xplat/octane-xplat/blob/main/packages/geolocation/README.md)
for a one-time position instead. Web and desktop report unsupported.

## Monitor one region

Install in an existing Xplat app and configure foreground/background location
permissions and usage descriptions for its native targets:

```sh
bun add @octane-xplat/geofencing
```

Call this from a user action that explains why the feature needs location.
The radius is in meters. A denied or unsupported request returns `null`; a
successful setup returns cleanup for the listener and this region:

```ts
import { geofencing } from '@octane-xplat/geofencing'

export async function monitorOffice() {
	if (!geofencing.supported) return null
	if ((await geofencing.ensure()) !== 'granted') return null
	if ((await geofencing.ensureBackground()) !== 'granted') return null
	const off = geofencing.onRegionEvent(({ identifier, eventType }) => {
		console.log(identifier, eventType)
	})
	try {
		await geofencing.startMonitoring([
			{ identifier: 'office', latitude: 37.33, longitude: -122.03, radius: 150 },
		])
	} catch (error) {
		off()
		throw error
	}
	return async () => {
		off()
		await geofencing.stopMonitoring(['office'])
	}
}
```

Keep the returned cleanup until the person disables this feature. Verify actual
enter/exit delivery with the app both active and suspended; successful
registration alone does not prove background delivery. iOS limits an app to
20 regions. OS permissions, power policy, and device conditions affect events.
The adapter buffers events delivered before listener attachment.

See the [public contract](https://github.com/octane-xplat/octane-xplat/blob/main/packages/geofencing/src/types.ts)
and [permission handling](https://octane-xplat.goddardai.org/platform-services#the-shared-service-shape).
