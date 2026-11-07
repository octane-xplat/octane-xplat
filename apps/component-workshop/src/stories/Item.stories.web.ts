// Uses the maintained ItemShowcase example; do not copy its implementation here.
import { ItemShowcase as Example } from '@xplat/astryx-sandbox/examples/item/ItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'item/basic',
  title: 'Item / Basic',
  componentId: '@octane-xplat/ui#Item',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
