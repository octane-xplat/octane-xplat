// Uses the maintained AvatarGroupOverflowShowcase example; do not copy its implementation here.
import { AvatarGroupOverflowShowcase as Example } from '@xplat/astryx-sandbox/examples/avatargroupoverflow/AvatarGroupOverflowShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'avatargroupoverflow/basic',
  title: 'AvatarGroupOverflow / Basic',
  componentId: '@octane-xplat/ui#AvatarGroupOverflow',
  targets: ['web'],
  component: Example,
  args: {},
})
