import { MenuPartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dropdownmenuradiogroup/basic',
  title: 'DropdownMenuRadioGroup / Basic',
  componentId: '@octane-xplat/ui#DropdownMenuRadioGroup',
  targets: ['web'],
  component: Example,
  args: {},
})
