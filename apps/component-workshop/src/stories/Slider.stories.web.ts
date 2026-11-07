// Uses the maintained SliderShowcase example; do not copy its implementation here.
import { SliderShowcase as Example } from '@xplat/astryx-sandbox/examples/slider/SliderShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'slider/basic',
  title: 'Slider / Basic',
  componentId: '@octane-xplat/ui#Slider',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
