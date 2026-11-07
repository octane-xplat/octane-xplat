// Uses the maintained CheckboxListItemShowcase example; do not copy its implementation here.
import { CheckboxListItemShowcase as Example } from '@xplat/astryx-sandbox/examples/checkbox/CheckboxListItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'checkboxlistitem/basic',
  title: 'CheckboxListItem / Basic',
  componentId: '@octane-xplat/ui#CheckboxListItem',
  targets: ['web'],
  component: Example,
  args: {},
})
