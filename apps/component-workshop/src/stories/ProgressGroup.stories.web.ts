import { ProgressGroupExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'progressgroup/basic',
  title: 'ProgressGroup / Basic',
  componentId: '@octane-xplat/ui#ProgressGroup',
  targets: ['web'],
  component: Example,
  args: {},
})
