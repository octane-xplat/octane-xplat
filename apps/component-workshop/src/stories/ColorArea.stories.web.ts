import { ColorAreaExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'colorarea/basic',
  title: 'ColorArea / Basic',
  componentId: '@octane-xplat/ui#ColorArea',
  targets: ['web'],
  component: Example,
  args: {},
})
