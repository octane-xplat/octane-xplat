import { LexicalEditorDemo as Example } from '@xplat/demos/LexicalEditorDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'lexical-lexicaleditor/basic',
  title: 'LexicalEditor (lexical) / Basic',
  componentId: '@octane-xplat/lexical#LexicalEditor',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
