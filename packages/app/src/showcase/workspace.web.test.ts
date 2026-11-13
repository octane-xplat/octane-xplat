import { expect, it } from 'vitest'
import { createWorkspace } from './workspace'

it('optimistically edits a shared record, confirms it, and restores confirmed values on rejection', async () => {
  const model = createWorkspace(0)

  try {
    await model.queries.ensureData(model.records, 'all')
    await model.update(['OX-001'], { title: 'A confirmed title' })
    expect(model.queries.getQueryData(model.records, 'all')?.[0].title).toBe('A confirmed title')
    await expect(model.update(['OX-001'], { title: 'Rejected title' }, true)).rejects.toThrow(
      'Save rejected',
    )

    expect(model.queries.getQueryData(model.records, 'all')?.[0].title).toBe('A confirmed title')
    await expect(model.update(['OX-001', 'OX-002'], { status: 'Done' }, true)).rejects.toThrow(
      'Save rejected',
    )

    expect(
      model.queries
        .getQueryData(model.records, 'all')
        ?.slice(0, 2)
        .map((item) => item.status),
    ).toEqual(['In progress', 'In review'])

    await model.update(['OX-001', 'OX-002'], { status: 'Done' })
    expect(
      model.queries
        .getQueryData(model.records, 'all')
        ?.slice(0, 2)
        .map((item) => item.status),
    ).toEqual(['Done', 'Done'])
  } finally {
    await model.queries.dispose()
  }
})

it('keeps previous data through a failed refresh and permits recovery and reset', async () => {
  const model = createWorkspace(0)

  try {
    await model.queries.ensureData(model.records, 'all')
    await model.update(['OX-003'], { title: 'Keep this confirmed change' })
    model.rejectNextRead()
    model.queries.invalidateQueries()
    await expect(model.queries.ensureData(model.records, 'all')).rejects.toThrow(
      'Connection interrupted',
    )

    expect(model.queries.getQueryData(model.records, 'all')?.[2].title).toBe(
      'Keep this confirmed change',
    )

    await model.queries.ensureData(model.records, 'all')
    expect(model.queries.getQueryData(model.records, 'all')?.[2].title).toBe(
      'Keep this confirmed change',
    )

    model.reset()
    expect(model.queries.getQueryData(model.records, 'all')?.[2].title).toBe(
      'Refine the checkout flow',
    )
  } finally {
    await model.queries.dispose()
  }
})
