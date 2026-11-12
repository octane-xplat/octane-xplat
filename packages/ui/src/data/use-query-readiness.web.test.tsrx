/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot, useContext } from 'octane'
import { expect, it, vi } from 'vitest'
import { DevActionScope } from '@octane-xplat/platform/dev-actions/readiness'
import { DevReadinessContext } from '@octane-xplat/platform/dev-readiness-context'
import type { DevReadinessScope } from '@octane-xplat/platform/dev-actions'
import { createQueryClient, defineQuery } from './query-cache'
import { useQuery$ } from './use-query'

it('shared query loading and refetch automatically block the nearest context scope', async () => {
  const client = createQueryClient()
  let loads = 0
  let finish: (value: string) => void = () => {}
  const query = defineQuery(
    ['readiness-fixture'],
    () =>
      new Promise<string>((resolve) => {
        loads++
        finish = resolve
      }),
  )

  let scope: DevReadinessScope | null = null
  function Reader() {
    scope = useContext(DevReadinessContext)

    const reader = useQuery$(client, query, 'fixture')

    return <span>{reader ? 'Observed' : 'Loading'}</span>
  }

  function Scene() {
    return (
      <DevActionScope label="Scene">
        <Reader />
      </DevActionScope>
    )
  }

  const host = document.createElement('div')

  document.body.append(host)

  const root = createRoot(host)

  try {
    act(() => root.render(<Scene />))
    await vi.waitFor(() => expect(scope?.snapshot().pending).toEqual(['Shared query']))
    await vi.waitFor(() => expect(loads).toBe(1))
    finish('First')
    await vi.waitFor(() => expect(scope?.snapshot().pending).toEqual([]))
    client.invalidateQueries()
    await vi.waitFor(() => expect(scope?.snapshot().pending).toEqual(['Shared query']))
    await vi.waitFor(() => expect(loads).toBe(2))
    finish('Second')
    await vi.waitFor(() => expect(scope?.snapshot().pending).toEqual([]))
  } finally {
    act(() => root.unmount())
    await client.dispose()
    host.remove()
  }
})
