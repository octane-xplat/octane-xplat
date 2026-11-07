// Uses the maintained TokenizerShowcase example; do not copy its implementation here.
import { TokenizerShowcase as Example } from '@xplat/astryx-sandbox/examples/tokenizer/TokenizerShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tokenizer/basic',
  title: 'Tokenizer / Basic',
  componentId: '@octane-xplat/ui#Tokenizer',
  targets: ['web'],
  component: Example,
  args: {},
})
