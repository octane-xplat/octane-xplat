// Uses the maintained AvatarShowcase example; do not copy its implementation here.
import { AvatarShowcase as Example } from '@xplat/astryx-sandbox/examples/avatar/AvatarShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'avatar/basic',
  title: 'Avatar / Basic',
  componentId: '@octane-xplat/ui#Avatar',
  targets: ['web'],
  component: Example,
  args: {},
})
