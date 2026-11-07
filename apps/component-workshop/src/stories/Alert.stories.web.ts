import { AlertExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'alert/basic',
  title: 'Alert / Basic',
  componentId: '@octane-xplat/ui#Alert',
  targets: ['web'],
  component: Example,
  args: {},
})
