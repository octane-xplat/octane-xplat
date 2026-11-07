import { MenuPartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dropdownmenusection/basic',
  title: 'DropdownMenuSection / Basic',
  componentId: '@octane-xplat/ui#DropdownMenuSection',
  targets: ['web'],
  component: Example,
  args: {},
})
