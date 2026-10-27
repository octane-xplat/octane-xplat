# `@octane-xplat/geofencing`

```sh
pnpm add @octane-xplat/geofencing
```

Circular region monitoring — `CLLocationManager` regions on iOS,
`GeofencingClient` on Android (custom bridge; no NS plugin exists). Region
enter/exit events arrive even while suspended; events delivered before a
listener attaches are buffered and replayed on `onRegionEvent` registration.

```ts
import { geofencing } from '@octane-xplat/geofencing'

await geofencing.ensure()
await geofencing.ensureBackground() // 'always' grant for suspended delivery
geofencing.onRegionEvent(({ identifier, eventType }) => notify(identifier, eventType))
await geofencing.startMonitoring([
	{ identifier: 'office', latitude: 37.33, longitude: -122.03, radius: 150 },
])
```

iOS caps at 20 monitored regions per app. Web/desktop report
`supported: false`. Foreground reads stay in `@octane-xplat/geolocation`;
scheduled work stays in `@octane-xplat/background-tasks`.
