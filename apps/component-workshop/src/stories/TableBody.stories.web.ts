import { TablePartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tablebody/basic',
  title: 'TableBody / Basic',
  componentId: '@octane-xplat/ui#TableBody',
  targets: ['web'],
  component: Example,
  args: {},
})
