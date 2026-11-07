// Uses the maintained DialogShowcase example; do not copy its implementation here.
import { DialogShowcase as Example } from '@xplat/astryx-sandbox/examples/dialog/DialogShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dialog/basic',
  title: 'Dialog / Basic',
  componentId: '@octane-xplat/ui#Dialog',
  targets: ['web'],
  component: Example,
  args: {},
})
