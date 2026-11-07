// Uses the maintained OverlayDemo example; do not copy its implementation here.
import { OverlayDemo as Example } from '@xplat/demos/OverlayDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'overlay/basic',
  title: 'Overlay / Basic',
  componentId: '@octane-xplat/ui#Overlay',
  targets: ['web'],
  component: Example,
  args: {},
})
