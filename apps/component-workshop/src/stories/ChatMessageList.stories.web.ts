// Uses the maintained ChatMessageListShowcase example; do not copy its implementation here.
import { ChatMessageListShowcase as Example } from '@xplat/astryx-sandbox/examples/chatmessagelist/ChatMessageListShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatmessagelist/basic',
  title: 'ChatMessageList / Basic',
  componentId: '@octane-xplat/ui/chat#ChatMessageList',
  targets: ['web'],
  component: Example,
  args: {},
})
