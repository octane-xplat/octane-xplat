import { TablePartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tablefooter/basic',
  title: 'TableFooter / Basic',
  componentId: '@octane-xplat/ui#TableFooter',
  targets: ['web'],
  component: Example,
  args: {},
})
