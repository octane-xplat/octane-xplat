import { InputRatingExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'inputrating/basic',
  title: 'InputRating / Basic',
  componentId: '@octane-xplat/ui#InputRating',
  targets: ['web'],
  component: Example,
  args: {},
})
