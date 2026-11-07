import { RadioIndicatorExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'radioindicator/basic',
  title: 'RadioIndicator / Basic',
  componentId: '@octane-xplat/ui#RadioIndicator',
  targets: ['web'],
  component: Example,
  args: {},
})
