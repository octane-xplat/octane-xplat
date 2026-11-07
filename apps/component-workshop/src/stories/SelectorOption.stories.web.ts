// Uses the maintained SelectorOptionShowcase example; do not copy its implementation here.
import { SelectorOptionShowcase as Example } from '@xplat/astryx-sandbox/examples/selector/SelectorOptionShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'selectoroption/basic',
  title: 'SelectorOption / Basic',
  componentId: '@octane-xplat/ui#SelectorOption',
  targets: ['web'],
  component: Example,
  args: {},
})
