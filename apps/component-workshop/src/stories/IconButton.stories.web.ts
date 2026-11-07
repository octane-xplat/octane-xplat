// Uses the maintained IconButtonShowcase example; do not copy its implementation here.
import { IconButtonShowcase as Example } from '@xplat/astryx-sandbox/examples/iconbutton/IconButtonShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'iconbutton/basic',
  title: 'IconButton / Basic',
  componentId: '@octane-xplat/ui#IconButton',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
