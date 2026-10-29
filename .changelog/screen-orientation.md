### Choose a phone's interface orientation

`@octane-xplat/screen-orientation` adds Expo-shaped orientation queries, locks,
default restoration and removable change subscriptions. iOS requires an app-delegate
callback; browsers and Android have OS restrictions. Android runtime remains unverified.

```ts
import { OrientationLock, lockAsync } from '@octane-xplat/screen-orientation'

await lockAsync(OrientationLock.LANDSCAPE)
```

See [setup and platform limits](https://github.com/octane-xplat/octane-xplat/tree/main/packages/screen-orientation).
