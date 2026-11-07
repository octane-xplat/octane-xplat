// Uses the maintained AvatarStatusDotShowcase example; do not copy its implementation here.
import { AvatarStatusDotShowcase as Example } from '@xplat/astryx-sandbox/examples/avatarstatusdot/AvatarStatusDotShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'avatarstatusdot/basic',
  title: 'AvatarStatusDot / Basic',
  componentId: '@octane-xplat/ui#AvatarStatusDot',
  targets: ['web'],
  component: Example,
  args: {},
})
