/** @jsxImportSource @octane-xplat/jsx/dom */
import 'octane/signals'
import { act, createRoot, useContext } from 'octane'
import { expect, it, vi } from 'vitest'
import { ReadinessScope, useReadiness$ } from '@octane-xplat/platform/readiness'
import { ReadinessContext } from '@octane-xplat/platform/readiness-context'
import type { ReadinessController } from '@octane-xplat/platform/readiness/controller'
import { createQueryClient, defineQuery } from './query-cache'
import { useQuery$ } from './use-query'

it('ordinary UI observes initial failure, recovery and usable background refresh without a development gate', async () => {
  const client = createQueryClient()
  let loads = 0
  let finish: (value: string) => void = () => {}
  let fail: (error: unknown) => void = () => {}
  const query = defineQuery(
    ['readiness-fixture'],
    () =>
      new Promise<string>((resolve, reject) => {
        loads++
        finish = resolve
        fail = reject
      }),
    { retryCount: 0 },
  )

  let scope: ReadinessController | null = null
  function Reader() {
    scope = useContext(ReadinessContext)
    useQuery$(client, query, 'fixture')

    const readiness$ = useReadiness$()

    return <span>{readiness$.get().status}</span>
  }

  function Scene() {
    return (
      <ReadinessScope label="Scene">
        <Reader />
      </ReadinessScope>
    )
  }

  const host = document.createElement('div')

  document.body.append(host)

  const root = createRoot(host)

  try {
    act(() => root.render(<Scene />))
    await vi.waitFor(() => expect(loads).toBe(1))
    await vi.waitFor(() => expect(host.textContent).toBe('pending'))
    fail(new Error('private initial failure'))
    await vi.waitFor(() => expect(host.textContent).toBe('blocked'))
    expect(scope!.snapshot().pending).toEqual([])
    expect(scope!.snapshot().failures).toEqual([{ label: 'Shared query', blocking: true }])
    expect(JSON.stringify(scope!.snapshot())).not.toContain('private')
    await expect(scope!.wait({ timeoutMs: 1000 })).rejects.toMatchObject({
      code: 'readiness_failed',
    })

    client.invalidateQueries()
    await vi.waitFor(() => expect(loads).toBe(2))
    await vi.waitFor(() => expect(host.textContent).toBe('pending'))
    finish('First')
    await vi.waitFor(() => expect(host.textContent).toBe('ready'))
    expect(scope!.snapshot().failures).toEqual([])

    client.invalidateQueries()
    await vi.waitFor(() => expect(loads).toBe(3))
    expect(host.textContent).toBe('ready')
    expect(scope!.snapshot().pending).toEqual([{ label: 'Shared query', blocking: false }])
    await scope!.wait({ timeoutMs: 1000 })

    const strict = scope!.wait({ timeoutMs: 1000, includeBackground: true })

    fail(new Error('private refresh failure'))
    await expect(strict).rejects.toMatchObject({ code: 'readiness_failed' })
    await vi.waitFor(() =>
      expect(scope!.snapshot().failures).toEqual([{ label: 'Shared query', blocking: false }]),
    )

    expect(host.textContent).toBe('ready')
    expect(scope!.snapshot().pending).toEqual([])

    client.invalidateQueries()
    await vi.waitFor(() => expect(loads).toBe(4))

    const recovered = scope!.wait({ timeoutMs: 1000, includeBackground: true })

    finish('Recovered')
    await recovered
    expect(scope!.snapshot().failures).toEqual([])
  } finally {
    act(() => root.unmount())
    await client.dispose()
    host.remove()
  }
})
