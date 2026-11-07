import { ThemeShowcase as Example } from '@xplat/astryx-sandbox/examples/theme/ThemeShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'theme/basic',
  title: 'Theme / Basic',
  componentId: '@octane-xplat/ui#Theme',
  targets: ['web'],
  component: Example,
  args: {},
})
