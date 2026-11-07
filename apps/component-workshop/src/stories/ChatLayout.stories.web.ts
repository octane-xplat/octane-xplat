// Uses the maintained ChatLayoutShowcase example; do not copy its implementation here.
import { ChatLayoutShowcase as Example } from '@xplat/astryx-sandbox/examples/chatlayout/ChatLayoutShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatlayout/basic',
  title: 'ChatLayout / Basic',
  componentId: '@octane-xplat/ui/chat#ChatLayout',
  targets: ['web'],
  component: Example,
  args: {},
})
