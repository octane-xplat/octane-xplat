import { KeyboardAvoidingExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'keyboardavoiding/basic',
  title: 'KeyboardAvoiding / Basic',
  componentId: '@octane-xplat/ui#KeyboardAvoiding',
  targets: ['web'],
  component: Example,
  args: {},
})
