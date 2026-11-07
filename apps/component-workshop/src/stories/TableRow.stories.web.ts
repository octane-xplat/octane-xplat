import { TablePartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tablerow/basic',
  title: 'TableRow / Basic',
  componentId: '@octane-xplat/ui#TableRow',
  targets: ['web'],
  component: Example,
  args: {},
})
