// Uses the maintained DropdownMenuWithSubmenu example; do not copy its implementation here.
import { DropdownMenuWithSubmenu as Example } from '@xplat/astryx-sandbox/examples/menu/DropdownMenuWithSubmenu.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dropdownmenusubmenu/basic',
  title: 'DropdownMenuSubMenu / Basic',
  componentId: '@octane-xplat/ui#DropdownMenuSubMenu',
  targets: ['web'],
  component: Example,
  args: {},
})
