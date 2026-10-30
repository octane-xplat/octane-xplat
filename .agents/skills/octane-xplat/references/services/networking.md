# Connectivity and incremental HTTP

Use for connectivity ownership, AppKit route changes, and incremental requests. Cancellation and availability follow the [service selection rules](../services.md).

## AppKit network route updates

Use `connectivity.subscribe` for live UI and always release its independent
registration. Active readers use the monitor's latest sample; unobserved reads
retain the native bounded one-second first-sample probe. Route availability is
not internet reachability. An unknown/unsupported probe is not measured offline.
The AppKit environment adapter forwards callback samples instead of re-probing,
acquires both cleanup handles before its initial notification, and attempts both
teardowns after retiring callbacks, preserving the first cleanup failure. Initial
listener failure unwinds acquisition; later native listener errors are isolated.
No native runtime behavior is qualified by the source/fake-host models.

```ts
import { connectivity } from '@octane-xplat/platform'

export function watchRoute(onOnline: (online: boolean | undefined) => void) {
	return connectivity.subscribe(state => onOnline(state.supported === false ? undefined : state.online))
}
```

See [AppKit route updates](../../../../../docs/platform/platform-services.md#appkit-route-updates).

## Native connectivity ownership

Framework NativeScript connectivity subscribers share one core monitor. Keep
each returned teardown: repeated callbacks have independent registrations.
Failed initial callbacks/reads or monitor setup roll back their registration;
callbacks added during dispatch receive their initial state once and wait for
the next event. Do not bypass the facade to add another core monitor owner.

```ts
import { connectivity } from '@octane-xplat/platform'

const stop = connectivity.subscribe(state => console.log(state.type))
stop()
```
Windows supplies a WinRT state reader to that same monitor owner. Online state
comes from the connection level, independently of the transport label: local,
constrained and internet access allow work, including unknown transports. No
profile/None is known offline; unavailable or malformed projection returns
supported false. Do not label unknown adapters offline or invent VPN/Bluetooth
classification. The Windows environment export selects the native runtime and
declarations; query clients therefore use app suspension and connectivity by
default. Window visibility drives NativeScript suspension; individual window
keyboard activation is a different signal. Mocked ownership/composition and a
sampled native read do not qualify reconnect delivery, app lifecycle or query
refresh. See [query lifecycle](../../../../../docs/app/data.md#the-shared-query-cache).

```ts
import { environment } from '@octane-xplat/platform/environment'

// undefined online permits work when connectivity cannot be established.
const online = environment.getSnapshot().online
```

### Incremental HTTP

NativeScript's default fetch buffers the response. Use the network leaf for
incremental bytes; it does not replace global fetch or provide a complete
Fetch-compatible client adapter. Handle cancellation and the documented
request/target subset in the [network guide](../../../../../packages/network/README.md).

```ts
import { requestStream } from '@octane-xplat/network'
const response = await requestStream('https://example.com/api/events')
const reader = response.body.getReader()
try { console.log((await reader.read()).value?.byteLength) }
finally { await reader.cancel(); reader.releaseLock() }
```

For the tested targets and remaining physical acceptance gates, see the
[Still-shaped readiness record](../../../../docs/notes/still-native-readiness.md).
