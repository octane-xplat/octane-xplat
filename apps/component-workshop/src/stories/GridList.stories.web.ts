import { GridListExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'gridlist/basic',
  title: 'GridList / Basic',
  componentId: '@octane-xplat/ui#GridList',
  targets: ['web'],
  component: Example,
  args: {},
})
