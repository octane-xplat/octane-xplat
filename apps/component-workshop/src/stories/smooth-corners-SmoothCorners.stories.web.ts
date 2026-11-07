import { SmoothCornersExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'smooth-corners-smoothcorners/basic',
  title: 'SmoothCorners (smooth-corners) / Basic',
  componentId: '@octane-xplat/smooth-corners#SmoothCorners',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
