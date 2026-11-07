// Uses the maintained ToggleButtonShowcase example; do not copy its implementation here.
import { ToggleButtonShowcase as Example } from '@xplat/astryx-sandbox/examples/togglebutton/ToggleButtonShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'togglebutton/basic',
  title: 'ToggleButton / Basic',
  componentId: '@octane-xplat/ui#ToggleButton',
  targets: ['web'],
  component: Example,
  args: {},
})
