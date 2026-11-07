import { BannerAd as Example } from '@octane-xplat/ads'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'ads-bannerad/basic',
  title: 'BannerAd (ads) / Basic',
  componentId: '@octane-xplat/ads#BannerAd',
  targets: ['ios', 'android'],
  capabilities: ['native-ad-unit-and-consent'],
  component: Example,
  args: { adUnitId: 'configure-your-own-ad-unit' },
})
