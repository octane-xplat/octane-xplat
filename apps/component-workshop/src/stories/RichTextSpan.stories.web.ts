// Uses the maintained RichTextDemo example; do not copy its implementation here.
import { RichTextDemo as Example } from '@xplat/demos/RichTextDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'richtextspan/basic',
  title: 'RichTextSpan / Basic',
  componentId: '@octane-xplat/ui#RichTextSpan',
  targets: ['web'],
  component: Example,
  args: {},
})
