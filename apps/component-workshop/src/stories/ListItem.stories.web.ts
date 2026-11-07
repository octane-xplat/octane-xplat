// Uses the maintained ListItemShowcase example; do not copy its implementation here.
import { ListItemShowcase as Example } from '@xplat/astryx-sandbox/examples/listitem/ListItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'listitem/basic',
  title: 'ListItem / Basic',
  componentId: '@octane-xplat/ui#ListItem',
  targets: ['web'],
  component: Example,
  args: {},
})
