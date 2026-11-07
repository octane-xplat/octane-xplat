// Uses the maintained SkeletonShowcase example; do not copy its implementation here.
import { SkeletonShowcase as Example } from '@xplat/astryx-sandbox/examples/skeleton/SkeletonShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'skeleton/basic',
  title: 'Skeleton / Basic',
  componentId: '@octane-xplat/ui#Skeleton',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
