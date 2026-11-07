import { MenuPartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dropdownmenulink/basic',
  title: 'DropdownMenuLink / Basic',
  componentId: '@octane-xplat/ui#DropdownMenuLink',
  targets: ['web'],
  component: Example,
  args: {},
})
