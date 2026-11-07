// Uses the maintained CarouselShowcase example; do not copy its implementation here.
import { CarouselShowcase as Example } from '@xplat/astryx-sandbox/examples/carousel/CarouselShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'carousel/basic',
  title: 'Carousel / Basic',
  componentId: '@octane-xplat/ui#Carousel',
  targets: ['web'],
  component: Example,
  args: {},
})
