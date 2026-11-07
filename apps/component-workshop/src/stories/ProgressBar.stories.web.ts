// Uses the maintained ProgressBarShowcase example; do not copy its implementation here.
import { ProgressBarShowcase as Example } from '@xplat/astryx-sandbox/examples/progressbar/ProgressBarShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'progressbar/basic',
  title: 'ProgressBar / Basic',
  componentId: '@octane-xplat/ui#ProgressBar',
  targets: ['web'],
  component: Example,
  args: {},
})
