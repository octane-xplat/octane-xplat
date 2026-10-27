### New package: `@octane-xplat/store-review`

The OS "rate this app" prompt — `SKStoreReviewController` on iOS and macOS,
Play In-App Review on Android. `requestReview()` is fire-and-forget (both
stores throttle and report no outcome); `storeUrl()` builds a store-page link
from configured ids.

```ts
import { storeReview } from '@octane-xplat/store-review'

storeReview.configure({ iosAppStoreId: '123456789' })
if (await storeReview.isAvailable()) await storeReview.requestReview()
```

Web, Linux, and Windows report `supported: false`. On Android the in-app
review flow only exists for Play-installed builds — `isAvailable()` reflects
that.
