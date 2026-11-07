import { RichTextEditorDemo as Example } from '@xplat/demos/RichTextEditorDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'richtext-richtexteditor/basic',
  title: 'RichTextEditor (richtext) / Basic',
  componentId: '@octane-xplat/richtext#RichTextEditor',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
