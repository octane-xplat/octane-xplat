import { SizeProviderExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'sizeprovider/basic',
  title: 'SizeProvider / Basic',
  componentId: '@octane-xplat/ui#SizeProvider',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
