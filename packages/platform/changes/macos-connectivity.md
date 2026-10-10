# macOS connectivity reporting

macOS now reports the current network route and sends updates to subscribers. Each subscriber receives an initial state; call the returned function when its owner ends.

```ts
import { connectivity } from '@octane-xplat/platform'

const state = connectivity.getState()
console.log(state.supported, state.online, state.type)
const unsubscribe = connectivity.subscribe((next) => console.log(next.online, next.type))
unsubscribe()
```

A usable route reports `online: true`; this does not guarantee internet access or that a particular request will succeed. Wi-Fi, Ethernet, and cellular routes retain the shared transport names. Other transports report `unknown`: Apple's path interface categories do not identify Bluetooth or VPN separately. A disconnected route reports `online: false` and `type: 'none'`.

```ts
import { connectivity } from '@octane-xplat/platform'

const state = connectivity.getState()
if (state.supported === false) console.log('Network status is unavailable')
else if (!state.online) console.log('No usable network route')
else console.log(`Usable route: ${state.type}`)
```

The CLI builds the package's native Network.framework bridge automatically. An older or custom host without this bridge, a failed monitor, or a read that cannot obtain its first sample within one second reports unsupported/offline/unknown. Subscriptions can recover when a later native sample arrives. No entitlement changes are included; signed sandbox policy and physical offline/reconnect behavior still need manual verification.

```ts
import { connectivity } from '@octane-xplat/platform'

const stop = connectivity.subscribe((state) => {
	if (state.supported === false) console.log('Waiting for an available network status probe')
	else console.log(state.online ? 'Route available' : 'Route unavailable')
})
stop()
```
