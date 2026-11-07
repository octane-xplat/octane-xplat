import { KeyboardExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'keyboard-keyboardstickyview/basic',
  title: 'KeyboardStickyView (keyboard) / Basic',
  componentId: '@octane-xplat/keyboard#KeyboardStickyView',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
