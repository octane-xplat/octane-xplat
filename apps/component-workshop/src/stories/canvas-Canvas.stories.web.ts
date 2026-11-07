import { CanvasDemo as Example } from '@xplat/demos/CanvasDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'canvas-canvas/basic',
  title: 'Canvas (canvas) / Basic',
  componentId: '@octane-xplat/canvas#Canvas',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
