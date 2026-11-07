import { FileInputDemo as Example } from '@xplat/demos/FileInputDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'files-fileinput/basic',
  title: 'FileInput (files) / Basic',
  componentId: '@octane-xplat/files#FileInput',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
