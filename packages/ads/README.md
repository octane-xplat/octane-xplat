# `@octane-xplat/ads`

```sh
pnpm add @octane-xplat/ads
```

Google AdMob — `<BannerAd>` plus interstitial, rewarded, and
rewarded-interstitial formats through `@nativescript/google-mobile-ads`.
Mirrors `react-native-google-mobile-ads` naming (Expo's ads packages are
deprecated). Consent (UMP/ATT) stays in the permissions seam.

```tsx
import { ads, BannerAd } from '@octane-xplat/ads'

await ads.initialize()

<BannerAd adUnitId="ca-app-pub-3940256099942544/6300978111" size="anchoredAdaptive" />

const rewarded = ads.createRewardedAd('ca-app-pub-3940256099942544/5224354917')
rewarded.onAdEvent((e) => e.type === 'earned_reward' && grant(e.reward))
rewarded.load(); rewarded.show()
```

Web/desktop report `supported: false` (AdSense is a different product).
`createAppOpenAd` throws — upstream ships no AppOpenAd wrapper.
