// Uses the maintained BaseTypeaheadShowcase example; do not copy its implementation here.
import { BaseTypeaheadShowcase as Example } from '@xplat/astryx-sandbox/examples/typeahead/BaseTypeaheadShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'basetypeahead/basic',
  title: 'BaseTypeahead / Basic',
  componentId: '@octane-xplat/ui#BaseTypeahead',
  targets: ['web'],
  component: Example,
  args: {},
})
