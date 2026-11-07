import { MeterExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'meter/basic',
  title: 'Meter / Basic',
  componentId: '@octane-xplat/ui#Meter',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
