### Release native connectivity listeners cleanly

NativeScript connectivity registrations now detach independently, including
when they use the same callback. Failed initial reads, callbacks and monitor
startup no longer leave a reader registered. Changes during dispatch avoid
duplicate initial updates, and reentrant setup shares one monitor.

```ts
import { connectivity, type ConnectivityState } from '@octane-xplat/platform'

const onNetwork = (state: ConnectivityState) => console.log(state.type)
const first = connectivity.subscribe(onNetwork)
const second = connectivity.subscribe(onNetwork)
first() // The second registration stays active.
second()
```

[Watch network state](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#watch-network-state)
