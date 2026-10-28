# @octane-xplat/ads

Show Google AdMob banners and fullscreen ads in an iOS or Android app.
Web and desktop report `supported: false`.

## Show a banner

Install in an existing Xplat app:

```sh
pnpm add @octane-xplat/ads
```

Before launching, configure the AdMob **app ID** in the native host:
`GADApplicationIdentifier` in `App_Resources/iOS/Info.plist`, or
`com.google.android.gms.ads.APPLICATION_ID` in the Android manifest's
application metadata. An app ID identifies the app; an **ad unit ID** identifies
an ad placement. Follow the [NativeScript plugin setup](https://docs.nativescript.org/plugins/google-mobile-ads)
for the remaining platform and consent configuration. Installing the package
does not complete that setup.

Initialize once during startup, after the app's consent flow:

```ts
import { ads } from '@octane-xplat/ads'

if (ads.supported) await ads.initialize()
```

Render this component from a phone screen after initialization. Supply an ad
unit for the current platform; use your provider's test unit while developing:

```tsx
import { BannerAd } from '@octane-xplat/ads'

export function SponsorBanner({ adUnitId }: { adUnitId: string }) {
	return <BannerAd adUnitId={adUnitId} size="anchoredAdaptive" />
}
```

A test banner should appear after loading. If it does not, check app ID,
ad unit platform, SDK errors, and network access before trying a production ad.
Fullscreen ads have a separate load lifecycle: wait for a loaded event before
showing one. The package does not wrap AppOpenAd; calling that factory throws.
See the [public contracts](https://github.com/octane-xplat/octane-xplat/blob/main/packages/ads/src/types.ts)
for the available formats and events.
