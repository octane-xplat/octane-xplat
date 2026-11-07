// Uses the maintained TabListShowcase example; do not copy its implementation here.
import { TabListShowcase as Example } from '@xplat/astryx-sandbox/examples/tablist/TabListShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tablist/basic',
  title: 'TabList / Basic',
  componentId: '@octane-xplat/ui#TabList',
  targets: ['web'],
  component: Example,
  args: {},
})
