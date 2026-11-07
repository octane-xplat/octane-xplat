// Uses the maintained RichTextDemo example; do not copy its implementation here.
import { RichTextDemo as Example } from '@xplat/demos/RichTextDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'richtext/basic',
  title: 'RichText / Basic',
  componentId: '@octane-xplat/ui#RichText',
  targets: ['web'],
  component: Example,
  args: {},
})
