# `@octane-xplat/store-review`

The OS "rate this app" prompt — `SKStoreReviewController` on iOS and macOS,
Play In-App Review (`com.google.android.play:review`) on Android. Both stores
throttle display and report no outcome, so `requestReview()` is
fire-and-forget; ask at success moments, not on a timer.

```sh
pnpm add @octane-xplat/store-review
```

```ts
import { storeReview } from '@octane-xplat/store-review'

storeReview.configure({ iosAppStoreId: '123456789' })

if (await storeReview.isAvailable()) {
	await storeReview.requestReview() // resolves whether or not a prompt appeared
}

storeReview.storeUrl() // 'https://apps.apple.com/app/id123456789'
```

Web, Linux, and Windows report `supported: false` — `storeUrl()` still works
once `configure()` has been given a store id. On Android, the in-app flow only
exists for Play-installed builds; `isAvailable()` reflects that.

Continue with [Device feature availability](https://octane-xplat.goddardai.org/platform-services).
