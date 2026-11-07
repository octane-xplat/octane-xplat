import { CameraView as Example } from '@octane-xplat/camera'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'camera-cameraview/basic',
  title: 'CameraView (camera) / Basic',
  componentId: '@octane-xplat/camera#CameraView',
  targets: ['web'],
  capabilities: ['camera-permission'],
  component: Example,
  args: {},
})
