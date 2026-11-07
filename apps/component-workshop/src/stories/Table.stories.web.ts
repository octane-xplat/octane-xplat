import { TablePartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'table/basic',
  title: 'Table / Basic',
  componentId: '@octane-xplat/ui#Table',
  targets: ['web'],
  component: Example,
  args: {},
})
