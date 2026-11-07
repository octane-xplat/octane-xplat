import { TableBulkActionsTable as Example } from '@xplat/astryx-sandbox/examples/table/TableBulkActionsTable.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tableselectiontoolbar/basic',
  title: 'TableSelectionToolbar / Basic',
  componentId: '@octane-xplat/ui#TableSelectionToolbar',
  targets: ['web'],
  component: Example,
  args: {},
})
