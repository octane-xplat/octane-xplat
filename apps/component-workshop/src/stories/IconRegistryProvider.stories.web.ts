import { IconRegistryProviderExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'iconregistryprovider/basic',
  title: 'IconRegistryProvider / Basic',
  componentId: '@octane-xplat/ui#IconRegistryProvider',
  targets: ['web'],
  component: Example,
  args: {},
})
