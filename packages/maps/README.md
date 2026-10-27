# `@octane-xplat/maps`

```sh
pnpm add @octane-xplat/maps
```

Declarative map view — Google Maps on iOS, Android, *and* web (one engine and
one tile provider, so camera, overlays, and events behave the same
everywhere; `expo-maps`' per-OS provider split is deliberately not followed).

```tsx
import { MapView, maps } from '@octane-xplat/maps'

maps.init({ apiKey: GOOGLE_MAPS_KEY }) // web only; native keys live in app metadata

<MapView
	cameraPosition={{ coordinates: { latitude: 35.68, longitude: 139.69 }, zoom: 12 }}
	markers={[{ id: 'hotel', coordinates: { latitude: 35.68, longitude: 139.69 }, title: 'Hotel' }]}
	polylines={[{ points: route, color: '#0064E0', width: 4 }]}
	onMapClick={({ coordinates }) => dropPin(coordinates)}
	onCameraMove={({ state }) => state === 'idle' && refreshMarkers()}
/>
```

Native keys come from app metadata (iOS `GMSApiKey`, Android manifest
meta-data). The `userLocationEnabled` dot delegates to the `location`
permission owned by `@octane-xplat/geolocation`.
