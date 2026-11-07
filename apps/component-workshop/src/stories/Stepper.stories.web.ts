// Uses the maintained StepperShowcase example; do not copy its implementation here.
import { StepperShowcase as Example } from '@xplat/astryx-sandbox/examples/stepper/StepperShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'stepper/basic',
  title: 'Stepper / Basic',
  componentId: '@octane-xplat/ui#Stepper',
  targets: ['web'],
  component: Example,
  args: {},
})
