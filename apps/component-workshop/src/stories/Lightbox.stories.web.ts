// Uses the maintained LightboxShowcase example; do not copy its implementation here.
import { LightboxShowcase as Example } from '@xplat/astryx-sandbox/examples/media/LightboxShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'lightbox/basic',
  title: 'Lightbox / Basic',
  componentId: '@octane-xplat/ui#Lightbox',
  targets: ['web'],
  component: Example,
  args: {},
})
