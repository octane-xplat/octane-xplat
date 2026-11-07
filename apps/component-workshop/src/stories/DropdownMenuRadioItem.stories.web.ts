import { MenuPartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dropdownmenuradioitem/basic',
  title: 'DropdownMenuRadioItem / Basic',
  componentId: '@octane-xplat/ui#DropdownMenuRadioItem',
  targets: ['web'],
  component: Example,
  args: {},
})
