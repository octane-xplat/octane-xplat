// Uses the maintained ContextMenuShowcase example; do not copy its implementation here.
import { ContextMenuShowcase as Example } from '@xplat/astryx-sandbox/examples/menu/ContextMenuShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'view/basic',
  title: 'View / Basic',
  componentId: '@octane-xplat/ui#View',
  targets: ['web'],
  component: Example,
  args: {},
})
