import { VirtualListExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'virtuallist/basic',
  title: 'VirtualList / Basic',
  componentId: '@octane-xplat/ui#VirtualList',
  targets: ['web'],
  component: Example,
  args: {},
})
