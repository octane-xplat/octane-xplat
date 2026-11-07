// Uses the maintained ChatMessageBubbleShowcase example; do not copy its implementation here.
import { ChatMessageBubbleShowcase as Example } from '@xplat/astryx-sandbox/examples/chatmessagebubble/ChatMessageBubbleShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatmessagebubble/basic',
  title: 'ChatMessageBubble / Basic',
  componentId: '@octane-xplat/ui/chat#ChatMessageBubble',
  targets: ['web'],
  component: Example,
  args: {},
})
