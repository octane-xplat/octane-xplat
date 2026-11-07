import { FieldGroupExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'fieldgroup/basic',
  title: 'FieldGroup / Basic',
  componentId: '@octane-xplat/ui#FieldGroup',
  targets: ['web'],
  component: Example,
  args: {},
})
