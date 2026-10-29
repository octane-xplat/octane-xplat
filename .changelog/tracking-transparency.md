### Ask for tracking authorization from an app action

`@octane-xplat/tracking-transparency` adds Expo-shaped permission methods and
an Octane hook, with iOS ATT configuration checks and explicit advertising-ID
access. Android uses an asynchronous worker-thread getter. Other hosts report
their capabilities and supported subsets; real prompt choices and device IDs
remain unqualified.

```ts
import { requestTrackingPermissionsAsync } from '@octane-xplat/tracking-transparency'

export async function requestFromButton() {
	return requestTrackingPermissionsAsync()
}
```

See [setup, consent and platform limits](https://github.com/octane-xplat/octane-xplat/tree/main/packages/tracking-transparency).
