// Uses the maintained BannerShowcase example; do not copy its implementation here.
import { BannerShowcase as Example } from '@xplat/astryx-sandbox/examples/banner/BannerShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'banner/basic',
  title: 'Banner / Basic',
  componentId: '@octane-xplat/ui#Banner',
  targets: ['web'],
  component: Example,
  args: {},
})
