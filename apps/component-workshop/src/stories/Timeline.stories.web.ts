import { TimelineExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'timeline/basic',
  title: 'Timeline / Basic',
  componentId: '@octane-xplat/ui#Timeline',
  targets: ['web'],
  component: Example,
  args: {},
})
