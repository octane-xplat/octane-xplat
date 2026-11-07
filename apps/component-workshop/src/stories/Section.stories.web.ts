// Uses the maintained ToolbarCardHeader example; do not copy its implementation here.
import { ToolbarCardHeader as Example } from '@xplat/astryx-sandbox/examples/toolbar/ToolbarCardHeader.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'section/basic',
  title: 'Section / Basic',
  componentId: '@octane-xplat/ui#Section',
  targets: ['web'],
  component: Example,
  args: {},
})
