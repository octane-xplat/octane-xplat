// Uses the maintained OverflowListShowcase example; do not copy its implementation here.
import { OverflowListShowcase as Example } from '@xplat/astryx-sandbox/examples/overflowlist/OverflowListShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'overflowlist/basic',
  title: 'OverflowList / Basic',
  componentId: '@octane-xplat/ui#OverflowList',
  targets: ['web'],
  component: Example,
  args: {},
})
