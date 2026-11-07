// Uses the maintained StepShowcase example; do not copy its implementation here.
import { StepShowcase as Example } from '@xplat/astryx-sandbox/examples/stepper/StepShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'step/basic',
  title: 'Step / Basic',
  componentId: '@octane-xplat/ui#Step',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
