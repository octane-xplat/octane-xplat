// Uses the maintained ListShowcase example; do not copy its implementation here.
import { ListShowcase as Example } from '@xplat/astryx-sandbox/examples/list/ListShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'list/basic',
  title: 'List / Basic',
  componentId: '@octane-xplat/ui#List',
  targets: ['web'],
  component: Example,
  args: {},
})
