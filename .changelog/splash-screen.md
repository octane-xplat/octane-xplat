### Keep the phone launch screen until the app is ready

The new splash-screen package adds Expo-shaped prevention, dismissal and
animation options. Arm it before Application.run(), then reveal the loaded
page after its required data is ready. A native timeout releases an abandoned
hold. Android runtime qualification remains unverified.

```ts
import { preventAutoHideAsync, hide } from '@octane-xplat/splash-screen'

void preventAutoHideAsync()
// Call from the root Page's ready handler:
export function revealReadyPage() { hide() }
```

[Native setup, lifecycle and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/splash-screen/README.md)
