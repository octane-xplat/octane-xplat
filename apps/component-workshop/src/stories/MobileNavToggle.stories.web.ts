// Uses the maintained MobileNavToggleShowcase example; do not copy its implementation here.
import { MobileNavToggleShowcase as Example } from '@octane-xplat/astryx-sandbox/examples/mobilenavtoggle/MobileNavToggleShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'mobilenavtoggle/basic',
  title: 'MobileNavToggle / Basic',
  componentId: '@octane-xplat/ui#MobileNavToggle',
  targets: ['web'],
  component: Example,
  args: {},
})
