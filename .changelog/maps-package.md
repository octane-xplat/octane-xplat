### New package: `@octane-xplat/maps`

Declarative `<MapView>` — Google Maps on iOS/Android/web via
`@nativescript/google-maps` and the Maps JS API: camera, declarative markers,
polylines, polygons, circles, tap and camera events, `animateCamera`/
`snapshot` handle.

```tsx
<MapView
	cameraPosition={{ coordinates: { latitude: 35.68, longitude: 139.69 }, zoom: 12 }}
	markers={[{ coordinates: { latitude: 35.68, longitude: 139.69 }, title: 'Hotel' }]}
/>
```

Web requires `maps.init({ apiKey })`; native keys come from app metadata.
macOS/Windows render an unsupported stub.
