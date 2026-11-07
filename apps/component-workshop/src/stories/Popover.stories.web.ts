// Uses the maintained PopoverShowcase example; do not copy its implementation here.
import { PopoverShowcase as Example } from '@xplat/astryx-sandbox/examples/popover/PopoverShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'popover/basic',
  title: 'Popover / Basic',
  componentId: '@octane-xplat/ui#Popover',
  targets: ['web'],
  component: Example,
  args: {},
})
