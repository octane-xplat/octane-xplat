import { ToastViewportExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'toastviewport/basic',
  title: 'ToastViewport / Basic',
  componentId: '@octane-xplat/ui#ToastViewport',
  targets: ['web'],
  component: Example,
  args: {},
})
