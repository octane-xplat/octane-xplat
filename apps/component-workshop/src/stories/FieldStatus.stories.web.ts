// Uses the maintained FieldStatusShowcase example; do not copy its implementation here.
import { FieldStatusShowcase as Example } from '@xplat/astryx-sandbox/examples/field/FieldStatusShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'fieldstatus/basic',
  title: 'FieldStatus / Basic',
  componentId: '@octane-xplat/ui#FieldStatus',
  targets: ['web'],
  component: Example,
  args: {},
})
