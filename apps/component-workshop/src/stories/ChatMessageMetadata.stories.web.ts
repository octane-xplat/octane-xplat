// Uses the maintained ChatMessageMetadataShowcase example; do not copy its implementation here.
import { ChatMessageMetadataShowcase as Example } from '@xplat/astryx-sandbox/examples/chatmessagemetadata/ChatMessageMetadataShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatmessagemetadata/basic',
  title: 'ChatMessageMetadata / Basic',
  componentId: '@octane-xplat/ui/chat#ChatMessageMetadata',
  targets: ['web'],
  component: Example,
  args: {},
})
