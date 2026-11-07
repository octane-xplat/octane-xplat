// Uses the maintained TextShowcase example; do not copy its implementation here.
import { TextShowcase as Example } from '@xplat/astryx-sandbox/examples/text/TextShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'text/basic',
  title: 'Text / Basic',
  componentId: '@octane-xplat/ui#Text',
  targets: ['web'],
  component: Example,
  args: {},
})
