// Uses the maintained TextAreaShowcase example; do not copy its implementation here.
import { TextAreaShowcase as Example } from '@xplat/astryx-sandbox/examples/textarea/TextAreaShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'textarea/basic',
  title: 'TextArea / Basic',
  componentId: '@octane-xplat/ui#TextArea',
  targets: ['web'],
  component: Example,
  args: {},
})
