import { MenuPartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dropdownmenucheckboxitem/basic',
  title: 'DropdownMenuCheckboxItem / Basic',
  componentId: '@octane-xplat/ui#DropdownMenuCheckboxItem',
  targets: ['web'],
  component: Example,
  args: {},
})
