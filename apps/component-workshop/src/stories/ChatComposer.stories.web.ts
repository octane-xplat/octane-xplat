// Uses the maintained ChatComposerShowcase example; do not copy its implementation here.
import { ChatComposerShowcase as Example } from '@xplat/astryx-sandbox/examples/chatcomposer/ChatComposerShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatcomposer/basic',
  title: 'ChatComposer / Basic',
  componentId: '@octane-xplat/ui/chat#ChatComposer',
  targets: ['web'],
  component: Example,
  args: {},
})
