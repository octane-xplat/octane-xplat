import { ChartExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'charts-chart/basic',
  title: 'Chart (charts) / Basic',
  componentId: '@octane-xplat/charts#Chart',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
