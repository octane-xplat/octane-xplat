// Uses the maintained BlockquoteShowcase example; do not copy its implementation here.
import { BlockquoteShowcase as Example } from '@xplat/astryx-sandbox/examples/blockquote/BlockquoteShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'blockquote/basic',
  title: 'Blockquote / Basic',
  componentId: '@octane-xplat/ui#Blockquote',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
