// Uses the maintained OutlineShowcase example; do not copy its implementation here.
import { OutlineShowcase as Example } from '@xplat/astryx-sandbox/examples/outline/OutlineShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'outline/basic',
  title: 'Outline / Basic',
  componentId: '@octane-xplat/ui#Outline',
  targets: ['web'],
  component: Example,
  args: {},
})
