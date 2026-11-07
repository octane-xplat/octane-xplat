// Uses the maintained ChatDictationButtonBasic example; do not copy its implementation here.
import { ChatDictationButtonBasic as Example } from '@xplat/astryx-sandbox/examples/chatdictationbutton/ChatDictationButtonBasic.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatdictationbutton/basic',
  title: 'ChatDictationButton / Basic',
  componentId: '@octane-xplat/ui/chat#ChatDictationButton',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
