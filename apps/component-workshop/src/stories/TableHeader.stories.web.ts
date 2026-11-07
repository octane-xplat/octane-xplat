import { TablePartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tableheader/basic',
  title: 'TableHeader / Basic',
  componentId: '@octane-xplat/ui#TableHeader',
  targets: ['web'],
  component: Example,
  args: {},
})
