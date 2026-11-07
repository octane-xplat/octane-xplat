// Uses the maintained ResizableShowcase example; do not copy its implementation here.
import { ResizableShowcase as Example } from '@xplat/astryx-sandbox/examples/resizable/ResizableShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'resizehandle/basic',
  title: 'ResizeHandle / Basic',
  componentId: '@octane-xplat/ui#ResizeHandle',
  targets: ['web'],
  component: Example,
  args: {},
})
