// Uses the maintained SearchDemo example; do not copy its implementation here.
import { SearchDemo as Example } from '@xplat/demos/SearchDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'searchinput/basic',
  title: 'SearchInput / Basic',
  componentId: '@octane-xplat/ui#SearchInput',
  targets: ['web'],
  component: Example,
  args: {},
})
