import { ColorFieldExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'colorfield/basic',
  title: 'ColorField / Basic',
  componentId: '@octane-xplat/ui#ColorField',
  targets: ['web'],
  component: Example,
  args: {},
})
