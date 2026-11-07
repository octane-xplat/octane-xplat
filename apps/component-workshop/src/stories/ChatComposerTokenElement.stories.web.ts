import { ChatComposerTokenElementExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chatcomposertokenelement/basic',
  title: 'ChatComposerTokenElement / Basic',
  componentId: '@octane-xplat/ui/chat#ChatComposerTokenElement',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
