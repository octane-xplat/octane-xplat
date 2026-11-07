import { ColorSliderExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'colorslider/basic',
  title: 'ColorSlider / Basic',
  componentId: '@octane-xplat/ui#ColorSlider',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
