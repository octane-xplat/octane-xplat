import { MenuPartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dropdownmenuseparator/basic',
  title: 'DropdownMenuSeparator / Basic',
  componentId: '@octane-xplat/ui#DropdownMenuSeparator',
  targets: ['web'],
  component: Example,
  args: {},
})
