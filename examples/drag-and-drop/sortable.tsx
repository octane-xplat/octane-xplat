import { useState } from 'octane'
import { Text, View } from '@octane-xplat/ui'
import { SortableList } from '@octane-xplat/dnd-kit'

/** Controlled order: drag a row onto another row to commit a reorder. */
export default function SortableExample(): unknown {
  // 1. Keep the committed item order in the screen's state.
  const [items, setItems] = useState(['alpha', 'beta', 'gamma'])

  // 2. Render the list and save the order reported after a drop.
  // 3. Give each row a handle that forwards its pan gesture.
  return (
    <View>
      <Text id="dnd-order">{items.join(',')}</Text>
      <SortableList
        items={items}
        activationDistance={8}
        onReorder={setItems}
        renderItem={(id) => (
          <View id={`dnd-${id}`} style={{ height: 64, padding: 12 }}>
            <Text>{String(id)}</Text>
          </View>
        )}
        renderHandle={(id, _index, pan) => (
          <View id={`dnd-handle-${id}`} gestures={pan} style={{ padding: 12 }}>
            <Text>⠿</Text>
          </View>
        )}
      />
    </View>
  )
}
