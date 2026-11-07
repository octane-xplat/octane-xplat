// Uses the maintained SelectableCardShowcase example; do not copy its implementation here.
import { SelectableCardShowcase as Example } from '@xplat/astryx-sandbox/examples/card/SelectableCardShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'selectablecard/basic',
  title: 'SelectableCard / Basic',
  componentId: '@octane-xplat/ui#SelectableCard',
  targets: ['web'],
  component: Example,
  args: {},
})
