# `@octane-xplat/firebase-analytics`

```sh
pnpm add @octane-xplat/firebase-analytics
```

Firebase product analytics — `@nativescript/firebase-analytics` on
iOS/Android (shares the `firebase-core` app bootstrap with `push` and
`firebase-crashlytics`), the Firebase JS SDK on web. Mirrors
`@react-native-firebase/analytics` naming.

```ts
import { firebaseAnalytics } from '@octane-xplat/firebase-analytics'

await firebaseAnalytics.init(config) // web only; native uses google-services files
await firebaseAnalytics.logScreenView('checkout')
await firebaseAnalytics.logEvent('add_to_cart', { item_id: sku })
await firebaseAnalytics.setUserProperty('plan', 'pro')
```

macOS/Windows report `supported: false` (no upstream SDK).
