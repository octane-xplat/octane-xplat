// Uses the maintained LayoutHeaderShowcase example; do not copy its implementation here.
import { LayoutHeaderShowcase as Example } from '@xplat/astryx-sandbox/examples/layoutheader/LayoutHeaderShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'layoutheader/basic',
  title: 'LayoutHeader / Basic',
  componentId: '@octane-xplat/ui#LayoutHeader',
  targets: ['web'],
  component: Example,
  args: {},
})
