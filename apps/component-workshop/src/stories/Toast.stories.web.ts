// Uses the maintained ToastShowcase example; do not copy its implementation here.
import { ToastShowcase as Example } from '@xplat/astryx-sandbox/examples/toast/ToastShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'toast/basic',
  title: 'Toast / Basic',
  componentId: '@octane-xplat/ui#Toast',
  targets: ['web'],
  component: Example,
  args: {},
})
