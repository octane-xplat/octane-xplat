// Uses the maintained PowerSearchShowcase example; do not copy its implementation here.
import { PowerSearchShowcase as Example } from '@xplat/astryx-sandbox/examples/powersearch/PowerSearchShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'powersearch/basic',
  title: 'PowerSearch / Basic',
  componentId: '@octane-xplat/ui#PowerSearch',
  targets: ['web'],
  component: Example,
  args: {},
})
