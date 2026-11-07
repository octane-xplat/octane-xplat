// Uses the maintained ChatComposerDrawerShowcase example; do not copy its implementation here.
import { ChatComposerDrawerShowcase as Example } from '@xplat/astryx-sandbox/examples/chatcomposerdrawer/ChatComposerDrawerShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatcomposerdrawer/basic',
  title: 'ChatComposerDrawer / Basic',
  componentId: '@octane-xplat/ui/chat#ChatComposerDrawer',
  targets: ['web'],
  component: Example,
  args: {},
})
