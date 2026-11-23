// Uses the maintained DropdownMenuItemShowcase example; do not copy its implementation here.
import { DropdownMenuItemShowcase as Example } from '@octane-xplat/astryx-sandbox/examples/menu/DropdownMenuItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dropdownmenuitem/basic',
  title: 'DropdownMenuItem / Basic',
  componentId: '@octane-xplat/ui#DropdownMenuItem',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
