import { DataGridExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'table-datagrid/basic',
  title: 'DataGrid (table) / Basic',
  componentId: '@octane-xplat/table#DataGrid',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
