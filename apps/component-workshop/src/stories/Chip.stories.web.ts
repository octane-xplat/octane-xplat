import { ChipExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'chip/basic',
  title: 'Chip / Basic',
  componentId: '@octane-xplat/ui#Chip',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
