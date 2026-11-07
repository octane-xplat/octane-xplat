// Uses the maintained SyntaxThemeDarkPreset example; do not copy its implementation here.
import { SyntaxThemeDarkPreset as Example } from '@xplat/astryx-sandbox/examples/syntaxtheme/SyntaxThemeDarkPreset.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'codeblock/basic',
  title: 'CodeBlock / Basic',
  componentId: '@octane-xplat/ui#CodeBlock',
  targets: ['web'],
  component: Example,
  args: {},
})
