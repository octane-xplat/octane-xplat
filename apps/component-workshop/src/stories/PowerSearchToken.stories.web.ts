import { PowerSearchTokenExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'powersearchtoken/basic',
  title: 'PowerSearchToken / Basic',
  componentId: '@octane-xplat/ui#PowerSearchToken',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
