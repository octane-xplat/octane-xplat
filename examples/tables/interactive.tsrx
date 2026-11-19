import { useState } from 'octane'
import { DataGrid, type DataGridFeatures, type Row, type TableState } from '@octane-xplat/table'
import { Text, View } from '@octane-xplat/ui'

type Order = { id: string; customer: string; count: number }

// 1. Give each row a stable ID and describe the columns to display.
const orders: Order[] = [
  { id: 'a', customer: 'Alice', count: 1 },
  { id: 'b', customer: 'Bob', count: 2 },
  { id: 'c', customer: 'Charlie', count: 3 },
]
const columns = [
  { accessorKey: 'customer', header: 'Customer', enableHiding: false },
  { accessorKey: 'count', header: 'Items' },
]

export function OrdersGrid() {
  // 2. Keep selection in the app so changes are available outside the grid.
  const [rowSelection, setRowSelection] = useState<TableState<DataGridFeatures>['rowSelection']>({})

  // 3. Enable controls and connect the selection update to that state.
  return (
    <View style={{ height: 400 }}>
      <DataGrid
        data={orders}
        columns={columns}
        getRowId={(order: Order) => order.id}
        getRowLabel={(row: Row<DataGridFeatures, Order>) => row.original.customer}
        showGlobalFilter
        showPagination
        showRowSelection
        showColumnSettings
        state={{ rowSelection }}
        options={{ onRowSelectionChange: setRowSelection }}
        renderEmpty={() => <Text>No matching orders</Text>}
      />
    </View>
  )
}
