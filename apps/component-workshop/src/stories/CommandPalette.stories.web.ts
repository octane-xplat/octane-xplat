// Uses the maintained CommandPaletteShowcase example; do not copy its implementation here.
import { CommandPaletteShowcase as Example } from '@xplat/astryx-sandbox/examples/commandpalette/CommandPaletteShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'commandpalette/basic',
  title: 'CommandPalette / Basic',
  componentId: '@octane-xplat/ui#CommandPalette',
  targets: ['web'],
  component: Example,
  args: {},
})
