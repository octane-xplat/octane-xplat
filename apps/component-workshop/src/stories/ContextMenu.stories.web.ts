// Uses the maintained ContextMenuShowcase example; do not copy its implementation here.
import { ContextMenuShowcase as Example } from '@xplat/astryx-sandbox/examples/menu/ContextMenuShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'contextmenu/basic',
  title: 'ContextMenu / Basic',
  componentId: '@octane-xplat/ui#ContextMenu',
  targets: ['web'],
  component: Example,
  args: {},
})
