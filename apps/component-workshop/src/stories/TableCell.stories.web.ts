import { TablePartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tablecell/basic',
  title: 'TableCell / Basic',
  componentId: '@octane-xplat/ui#TableCell',
  targets: ['web'],
  component: Example,
  args: {},
})
