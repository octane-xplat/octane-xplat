// Uses the maintained MarkdownShowcase example; do not copy its implementation here.
import { MarkdownShowcase as Example } from '@xplat/astryx-sandbox/examples/markdown/MarkdownShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'markdown/basic',
  title: 'Markdown / Basic',
  componentId: '@octane-xplat/ui/markdown#Markdown',
  targets: ['web'],
  component: Example,
  args: {},
})
