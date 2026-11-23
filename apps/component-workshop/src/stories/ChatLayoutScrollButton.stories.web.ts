// Uses the maintained ChatLayoutScrollButtonLabels example; do not copy its implementation here.
import { ChatLayoutScrollButtonLabels as Example } from '@octane-xplat/astryx-sandbox/examples/chatlayoutscrollbutton/ChatLayoutScrollButtonLabels.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatlayoutscrollbutton/basic',
  title: 'ChatLayoutScrollButton / Basic',
  componentId: '@octane-xplat/ui/chat#ChatLayoutScrollButton',
  targets: ['web'],
  component: Example,
  args: {},
})
