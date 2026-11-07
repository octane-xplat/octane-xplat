import { KeyboardExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'keyboard-keyboardawarescrollview/basic',
  title: 'KeyboardAwareScrollView (keyboard) / Basic',
  componentId: '@octane-xplat/keyboard#KeyboardAwareScrollView',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
