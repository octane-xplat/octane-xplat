// Uses the maintained AvatarGroupShowcase example; do not copy its implementation here.
import { AvatarGroupShowcase as Example } from '@xplat/astryx-sandbox/examples/avatargroup/AvatarGroupShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'avatargroup/basic',
  title: 'AvatarGroup / Basic',
  componentId: '@octane-xplat/ui#AvatarGroup',
  targets: ['web'],
  component: Example,
  args: {},
})
