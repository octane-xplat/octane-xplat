// Uses the maintained TypeaheadItemShowcase example; do not copy its implementation here.
import { TypeaheadItemShowcase as Example } from '@xplat/astryx-sandbox/examples/typeahead/TypeaheadItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'typeaheaditem/basic',
  title: 'TypeaheadItem / Basic',
  componentId: '@octane-xplat/ui#TypeaheadItem',
  targets: ['web'],
  component: Example,
  args: {},
})
