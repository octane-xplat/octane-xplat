// Uses the maintained TypeaheadShowcase example; do not copy its implementation here.
import { TypeaheadShowcase as Example } from '@xplat/astryx-sandbox/examples/typeahead/TypeaheadShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'typeahead/basic',
  title: 'Typeahead / Basic',
  componentId: '@octane-xplat/ui#Typeahead',
  targets: ['web'],
  component: Example,
  args: {},
})
