// Uses the maintained ChatMessageShowcase example; do not copy its implementation here.
import { ChatMessageShowcase as Example } from '@xplat/astryx-sandbox/examples/chatmessage/ChatMessageShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatmessage/basic',
  title: 'ChatMessage / Basic',
  componentId: '@octane-xplat/ui/chat#ChatMessage',
  targets: ['web'],
  component: Example,
  args: {},
})
