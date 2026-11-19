import { useState } from 'octane'
import { PowerSearch, Text, VStack, createPowerSearchConfig } from '@octane-xplat/ui'
import type { PowerSearchFilterFor } from '@octane-xplat/ui'

// 1. Describe the fields people can use to filter the list.
const { config, applyFilters } = createPowerSearchConfig([
  { key: 'title', type: 'string', label: 'Title' },
  { key: 'year', type: 'number', label: 'Year' },
] as const)

const books = [
  { title: 'A Walk in the Woods', year: 1998 },
  { title: 'The Art of Travel', year: 2002 },
  { title: 'The Book of Delights', year: 2019 },
]

export function BookSearch() {
  // 2. Keep the selected filters in the app so the list can use them.
  const [filters, setFilters] = useState<ReadonlyArray<PowerSearchFilterFor<typeof config>>>([])

  // 3. Apply those filters to the local books on each render.
  const visibleBooks = applyFilters(filters, books)

  // 4. Connect the search control and show the matching titles.
  return (
    <VStack gap={2}>
      <PowerSearch config={config} filters={filters} onChange={setFilters} />
      <Text>{visibleBooks.map((book) => book.title).join(', ') || 'No matching books'}</Text>
    </VStack>
  )
}
