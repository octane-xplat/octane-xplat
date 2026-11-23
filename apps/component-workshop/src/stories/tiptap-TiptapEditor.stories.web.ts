import { TiptapEditorDemo as Example } from '@octane-xplat/demos/TiptapEditorDemo.tsrx'
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
