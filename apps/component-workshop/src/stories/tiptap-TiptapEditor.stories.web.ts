import { TiptapEditorDemo as Example } from '@xplat/demos/TiptapEditorDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tiptap-tiptapeditor/basic',
  title: 'TiptapEditor (tiptap) / Basic',
  componentId: '@octane-xplat/tiptap#TiptapEditor',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
