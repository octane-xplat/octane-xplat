# @octane-xplat/maps

Show a Google map with markers in an iOS, Android, or web app. A shared prop
shape keeps the screen code similar; using one map provider does not establish
identical interaction or rendering on every target.

## Show a place

Install in an existing Xplat app:

```sh
pnpm add @octane-xplat/maps
```

Configure a Google Maps project and an API key for each platform. The native
plugin reads `TNSGoogleMapsAPIKey` from the iOS Info.plist and
`com.google.android.geo.API_KEY` from Android application metadata. Follow the
[NativeScript Google Maps setup](https://docs.nativescript.org/plugins/google-maps)
for platform prerequisites. For web, initialize before mounting the map:

```ts
// bootstrap.web.ts — call with your project's browser API key.
import { maps } from '@octane-xplat/maps'

export async function initializeMaps(apiKey: string) {
	await maps.init({ apiKey })
}
```

Put this component in a `.tsx` or `.tsrx` screen with a sized parent:

```tsx
import { MapView } from '@octane-xplat/maps'

export function HotelMap() {
	const hotel = { latitude: 35.68, longitude: 139.69 }
	return (
		<MapView
			className="hotel-map"
			cameraPosition={{ coordinates: hotel, zoom: 12 }}
			markers={[{ id: 'hotel', coordinates: hotel, title: 'Hotel' }]}
			onError={({ message }) => console.log('Map failed:', message)}
		/>
	)
}
```

Add a height in the app stylesheet:

```css
.hotel-map {
	height: 320px;
}
```

The map should open over Tokyo with a Hotel marker. A blank map calls for
checking the API key's platform restrictions, SDK enablement, network access,
and container size. See the
[map props](https://github.com/octane-xplat/octane-xplat/blob/main/packages/maps/src/props.ts)
for overlays and events, and [device feature guidance](https://octane-xplat.goddardai.org/platform-services)
when adding location access.
