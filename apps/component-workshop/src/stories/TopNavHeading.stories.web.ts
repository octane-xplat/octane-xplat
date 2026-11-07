// Uses the maintained TopNavHeadingShowcase example; do not copy its implementation here.
import { TopNavHeadingShowcase as Example } from '@xplat/astryx-sandbox/examples/topnavheading/TopNavHeadingShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'topnavheading/basic',
  title: 'TopNavHeading / Basic',
  componentId: '@octane-xplat/ui#TopNavHeading',
  targets: ['web'],
  component: Example,
  args: {},
})
