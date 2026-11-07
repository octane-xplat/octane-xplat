// Uses the maintained ChatComposerInputShowcase example; do not copy its implementation here.
import { ChatComposerInputShowcase as Example } from '@xplat/astryx-sandbox/examples/chatcomposerinput/ChatComposerInputShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatcomposerinput/basic',
  title: 'ChatComposerInput / Basic',
  componentId: '@octane-xplat/ui/chat#ChatComposerInput',
  targets: ['web'],
  component: Example,
  args: {},
})
