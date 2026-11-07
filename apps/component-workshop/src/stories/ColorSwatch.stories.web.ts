import { ColorSwatchExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'colorswatch/basic',
  title: 'ColorSwatch / Basic',
  componentId: '@octane-xplat/ui#ColorSwatch',
  targets: ['web'],
  component: Example,
  args: {},
})
