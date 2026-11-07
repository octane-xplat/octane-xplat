import { ColorPickerExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'colorpicker/basic',
  title: 'ColorPicker / Basic',
  componentId: '@octane-xplat/ui#ColorPicker',
  targets: ['web'],
  component: Example,
  args: {},
})
