// Uses the maintained VisuallyHiddenShowcase example; do not copy its implementation here.
import { VisuallyHiddenShowcase as Example } from '@xplat/astryx-sandbox/examples/visuallyhidden/VisuallyHiddenShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'visuallyhidden/basic',
  title: 'VisuallyHidden / Basic',
  componentId: '@octane-xplat/ui#VisuallyHidden',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
