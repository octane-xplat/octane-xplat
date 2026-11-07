// Uses the maintained LayoutDemo example; do not copy its implementation here.
import { LayoutDemo as Example } from '@xplat/demos/LayoutDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'spacer/basic',
  title: 'Spacer / Basic',
  componentId: '@octane-xplat/ui#Spacer',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
