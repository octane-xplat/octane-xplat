import { CheckIndicatorExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'checkindicator/basic',
  title: 'CheckIndicator / Basic',
  componentId: '@octane-xplat/ui#CheckIndicator',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
