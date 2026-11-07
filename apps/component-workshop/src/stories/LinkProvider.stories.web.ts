// Uses the maintained LinkProviderCustomLink example; do not copy its implementation here.
import { LinkProviderCustomLink as Example } from '@xplat/astryx-sandbox/examples/link/LinkProviderCustomLink.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'linkprovider/basic',
  title: 'LinkProvider / Basic',
  componentId: '@octane-xplat/ui#LinkProvider',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
