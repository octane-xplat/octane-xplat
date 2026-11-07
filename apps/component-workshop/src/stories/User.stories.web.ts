// Uses the maintained CodeBlockHighlightedLines example; do not copy its implementation here.
import { CodeBlockHighlightedLines as Example } from '@xplat/astryx-sandbox/examples/codeblock/CodeBlockHighlightedLines.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'user/basic',
  title: 'User / Basic',
  componentId: '@octane-xplat/ui#User',
  targets: ['web'],
  component: Example,
  args: {},
})
