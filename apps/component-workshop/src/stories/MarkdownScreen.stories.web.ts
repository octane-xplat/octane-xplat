import { MarkdownScreenExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'markdownscreen/basic',
  title: 'MarkdownScreen / Basic',
  componentId: '@octane-xplat/ui/markdown#MarkdownScreen',
  targets: ['web'],
  component: Example,
  args: {},
})
