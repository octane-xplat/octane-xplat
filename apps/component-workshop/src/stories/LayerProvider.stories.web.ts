import { LayerProviderExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'layerprovider/basic',
  title: 'LayerProvider / Basic',
  componentId: '@octane-xplat/ui#LayerProvider',
  targets: ['web'],
  component: Example,
  args: {},
})
