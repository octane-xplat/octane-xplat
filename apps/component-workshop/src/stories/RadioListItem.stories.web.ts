// Uses the maintained RadioListItemShowcase example; do not copy its implementation here.
import { RadioListItemShowcase as Example } from '@xplat/astryx-sandbox/examples/radiolist/RadioListItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'radiolistitem/basic',
  title: 'RadioListItem / Basic',
  componentId: '@octane-xplat/ui#RadioListItem',
  targets: ['web'],
  component: Example,
  args: {},
})
