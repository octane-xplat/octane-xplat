// Uses the maintained TokenShowcase example; do not copy its implementation here.
import { TokenShowcase as Example } from '@xplat/astryx-sandbox/examples/token/TokenShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'token/basic',
  title: 'Token / Basic',
  componentId: '@octane-xplat/ui#Token',
  targets: ['web'],
  component: Example,
  args: {},
})
