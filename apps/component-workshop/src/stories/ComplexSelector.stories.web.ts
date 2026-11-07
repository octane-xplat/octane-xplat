// Uses the maintained ComplexSelectorShowcase example; do not copy its implementation here.
import { ComplexSelectorShowcase as Example } from '@xplat/astryx-sandbox/examples/complexselector/ComplexSelectorShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'complexselector/basic',
  title: 'ComplexSelector / Basic',
  componentId: '@octane-xplat/ui#ComplexSelector',
  targets: ['web'],
  component: Example,
  args: {},
})
