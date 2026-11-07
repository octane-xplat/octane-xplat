// Uses the maintained ChatSystemMessageShowcase example; do not copy its implementation here.
import { ChatSystemMessageShowcase as Example } from '@xplat/astryx-sandbox/examples/chatsystemmessage/ChatSystemMessageShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatsystemmessage/basic',
  title: 'ChatSystemMessage / Basic',
  componentId: '@octane-xplat/ui/chat#ChatSystemMessage',
  targets: ['web'],
  component: Example,
  args: {},
})
