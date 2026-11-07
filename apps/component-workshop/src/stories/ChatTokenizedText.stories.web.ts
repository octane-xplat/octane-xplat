// Uses the maintained ChatTokenizedTextShowcase example; do not copy its implementation here.
import { ChatTokenizedTextShowcase as Example } from '@xplat/astryx-sandbox/examples/chattokenizedtext/ChatTokenizedTextShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chattokenizedtext/basic',
  title: 'ChatTokenizedText / Basic',
  componentId: '@octane-xplat/ui/chat#ChatTokenizedText',
  targets: ['web'],
  component: Example,
  args: {},
})
