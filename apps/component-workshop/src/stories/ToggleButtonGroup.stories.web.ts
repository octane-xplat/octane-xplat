// Uses the maintained ToggleButtonGroupShowcase example; do not copy its implementation here.
import { ToggleButtonGroupShowcase as Example } from '@xplat/astryx-sandbox/examples/togglebutton/ToggleButtonGroupShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'togglebuttongroup/basic',
  title: 'ToggleButtonGroup / Basic',
  componentId: '@octane-xplat/ui#ToggleButtonGroup',
  targets: ['web'],
  component: Example,
  args: {},
})
