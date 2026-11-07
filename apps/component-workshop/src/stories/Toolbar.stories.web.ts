// Uses the maintained ToolbarThreeSlot example; do not copy its implementation here.
import { ToolbarThreeSlot as Example } from '@xplat/astryx-sandbox/examples/toolbar/ToolbarThreeSlot.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'toolbar/basic',
  title: 'Toolbar / Basic',
  componentId: '@octane-xplat/ui#Toolbar',
  targets: ['web'],
  component: Example,
  args: {},
})
