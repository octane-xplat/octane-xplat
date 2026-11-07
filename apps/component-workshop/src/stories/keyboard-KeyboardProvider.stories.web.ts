import { KeyboardExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'keyboard-keyboardprovider/basic',
  title: 'KeyboardProvider (keyboard) / Basic',
  componentId: '@octane-xplat/keyboard#KeyboardProvider',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
