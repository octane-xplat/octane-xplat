import { CheckboxIndicatorExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'checkboxindicator/basic',
  title: 'CheckboxIndicator / Basic',
  componentId: '@octane-xplat/ui#CheckboxIndicator',
  targets: ['web'],
  component: Example,
  args: {},
})
