// Uses the maintained DeviceDemo example; do not copy its implementation here.
import { DeviceDemo as Example } from '@xplat/demos/DeviceDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'safearea/basic',
  title: 'SafeArea / Basic',
  componentId: '@octane-xplat/ui#SafeArea',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
