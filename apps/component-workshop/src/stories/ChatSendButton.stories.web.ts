// Uses the maintained ChatSendButtonShowcase example; do not copy its implementation here.
import { ChatSendButtonShowcase as Example } from '@xplat/astryx-sandbox/examples/chatsendbutton/ChatSendButtonShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatsendbutton/basic',
  title: 'ChatSendButton / Basic',
  componentId: '@octane-xplat/ui/chat#ChatSendButton',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
