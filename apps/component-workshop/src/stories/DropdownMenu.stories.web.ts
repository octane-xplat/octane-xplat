// Uses the maintained DropdownMenuShowcase example; do not copy its implementation here.
import { DropdownMenuShowcase as Example } from '@xplat/astryx-sandbox/examples/menu/DropdownMenuShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dropdownmenu/basic',
  title: 'DropdownMenu / Basic',
  componentId: '@octane-xplat/ui#DropdownMenu',
  targets: ['web'],
  component: Example,
  args: {},
})
