import { createQueryClient, defineQuery, createStore } from '@octane-xplat/ui/data'

export type WorkStatus = 'In progress' | 'In review' | 'Done'
export type WorkItem = {
  id: string
  title: string
  project: string
  owner: string
  status: WorkStatus
  priority: string
  revision: number
}

const TITLES = [
  'Refresh the onboarding journey',
  'Make search feel instant',
  'Refine the checkout flow',
  'Ship the activity timeline',
  'Review the accessibility audit',
  'Tighten the empty states',
  'Update the mobile navigation',
  'Prepare the launch assets',
  'Polish the document toolbar',
  'Resolve the keyboard overlap',
  'Simplify team permissions',
  'Connect the export pipeline',
]

const PROJECTS = ['Atlas', 'Forma', 'Orbit']
const OWNERS = ['Ada', 'Noor', 'Eli', 'June']
const STATUSES: WorkStatus[] = ['In progress', 'In review', 'Done']

function seed(): WorkItem[] {
  return Array.from({ length: 240 }, (_, i) => ({
    id: `OX-${String(i + 1).padStart(3, '0')}`,
    title: TITLES[i % TITLES.length] + (i >= 12 ? ` · ${Math.floor(i / 12) + 1}` : ''),
    project: PROJECTS[Math.floor(i / 4) % 3],
    owner: OWNERS[i % 4],
    status: STATUSES[i % 3],
    priority: i % 5 === 0 ? 'High' : 'Normal',
    revision: 1,
  }))
}

export function waitForRequest(signal: AbortSignal, ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(new Error('Request cancelled'))
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, ms)

    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) {
      abort()
    }
  })
}

/** A deterministic in-process transport; every view uses the real query cache. */
export function createWorkspace(latencyMs = 650) {
  let confirmed = seed()
  let rejectRead = false
  const queries = createQueryClient({ namespace: 'showcase-workspace' })
  const records = defineQuery(
    ['work-items'],
    async (_key: string, { signal }) => {
      await waitForRequest(signal, latencyMs)
      if (rejectRead) {
        rejectRead = false
        throw new Error('Connection interrupted. Your previous results are still available.')
      }

      return confirmed.map((item) => ({ ...item }))
    },
    { staleTimeMs: 60_000, retryCount: 0 },
  )

  return {
    queries,
    records,
    rejectNextRead() {
      rejectRead = true
    },
    async update(
      ids: string[],
      patch: Partial<Pick<WorkItem, 'title' | 'status'>>,
      reject = false,
    ) {
      const selected = new Set(ids)

      return queries.runOptimistic(records, 'all', async (operation, items$, { signal }) => {
        operation.set(items$, (items) =>
          items.map((item) => (selected.has(item.id) ? { ...item, ...patch } : item)),
        )

        await waitForRequest(signal, latencyMs)
        if (reject) {
          throw new Error(
            'Save rejected. The previous values have been restored; your draft is still here.',
          )
        }

        confirmed = confirmed.map((item) =>
          selected.has(item.id) ? { ...item, ...patch, revision: item.revision + 1 } : item,
        )

        const receipt = confirmed.map((item) => ({ ...item }))

        operation.adopt(receipt)
        return receipt
      })
    },
    reset() {
      confirmed = seed()
      queries.setQueryData(
        records,
        'all',
        confirmed.map((item) => ({ ...item })),
      )
    },
  }
}

export type Workspace = ReturnType<typeof createWorkspace>
export const workspace = createWorkspace()
export const workspaceView = createStore({
  search: '',
  status: 'All',
  page: 0,
  descending: false,
  selected: [] as string[],
  detail: null as string | null,
})
