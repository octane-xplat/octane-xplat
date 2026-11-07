// Uses the maintained FieldLabelShowcase example; do not copy its implementation here.
import { FieldLabelShowcase as Example } from '@xplat/astryx-sandbox/examples/field/FieldLabelShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'fieldlabel/basic',
  title: 'FieldLabel / Basic',
  componentId: '@octane-xplat/ui#FieldLabel',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
