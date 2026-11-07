// Uses the maintained ChatToolCallsShowcase example; do not copy its implementation here.
import { ChatToolCallsShowcase as Example } from '@xplat/astryx-sandbox/examples/chattoolcalls/ChatToolCallsShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chattoolcalls/basic',
  title: 'ChatToolCalls / Basic',
  componentId: '@octane-xplat/ui/chat#ChatToolCalls',
  targets: ['web'],
  component: Example,
  args: {},
})
