// Uses the maintained ShellNavTemplate example; do not copy its implementation here.
import { ShellNavTemplate as Example } from '@xplat/astryx-sandbox/examples/pages/shell-nav.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dropdownmenudivider/basic',
  title: 'DropdownMenuDivider / Basic',
  componentId: '@octane-xplat/ui#DropdownMenuDivider',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
