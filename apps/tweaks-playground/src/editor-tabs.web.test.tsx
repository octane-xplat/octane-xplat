/** @jsxImportSource @octane-xplat/jsx/dom */
import { expect, it, vi } from 'vitest'
import { createRoot } from 'octane'
import { connectDevtools } from '@octane-xplat/devtools/client'
import type { DevSocket } from '../../../packages/devtools/src/types.ts'
import { TweaksPanel, StylesPanel } from '../../../packages/tweaks/src/devtools/Panel.tsrx'

it('renders separate editors and scopes their save and revert actions', async () => {
  const sent: { data?: { type: string; scope?: string } }[] = []
  const socket: DevSocket = {
    readyState: 1,
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    send: (data) => sent.push(JSON.parse(data)),
    close() {},
  }

  const emit = (data: unknown) => socket.onmessage?.({ data: JSON.stringify(data) })
  const connection = connectDevtools(
    {
      endpoint: 'http://127.0.0.1:5200/rpc',
      instanceId: 'a'.repeat(32),
      devtoolsToken: 'b'.repeat(64),
      appRoot: '/fixture',
    },
    { socket: () => socket },
  )

  emit({ type: 'ready', panel: 'p', backends: [{ channel: 'tweaks', targetId: 'web' }] })

  const state = {
    type: 'state',
    server: { name: 'fixture', root: '/fixture' },
    clients: [{ clientId: 'c', label: 'web' }],
    entries: [
      {
        id: 'tweak',
        file: 'App.tsx',
        name: 'speed',
        group: null,
        input: { type: 'number' },
        value: 1,
        runtimeValue: 2,
        override: 2,
        dirty: true,
        writable: true,
        mountedBy: ['c'],
      },
    ],
    styles: [
      {
        id: 'style',
        kind: 'inline',
        file: 'App.tsx',
        line: 1,
        label: 'Card',
        properties: [{ path: ['padding'], value: 4, editable: true }],
        writable: true,
        draft: { set: { padding: 8 }, delete: [] },
        dirty: true,
        mountedBy: ['c'],
        preview: 'live',
      },
    ],
    unmountedDirty: [],
    picking: false,
  }

  for (const scope of ['tweaks', 'styles'] as const) {
    sent.length = 0

    const container = document.createElement('div')

    document.body.append(container)

    const root = createRoot(container)

    try {
      root.render(scope === 'tweaks' ? TweaksPanel : StylesPanel, { connection, state: 'live' })
      await vi.waitFor(() => expect(container.querySelector(`#${scope}-panel`)).not.toBeNull())
      await vi.waitFor(() => expect(sent.at(-1)?.data?.type).toBe('hello'))
      emit({ type: 'channel', from: 'backend', channel: 'tweaks', targetId: 'web', data: state })
      await vi.waitFor(() =>
        expect(container.querySelector('#dirty-count')?.textContent).toBe('1 unsaved'),
      )

      expect(container.querySelector('#styles\\.section') !== null).toBe(scope === 'styles')
      expect(container.querySelector('#pick') !== null).toBe(scope === 'styles')
      expect(container.textContent?.includes('speed')).toBe(scope === 'tweaks')
      container.querySelector<HTMLElement>('#revert-all')!.click()
      expect(sent.at(-1)?.data).toEqual({ type: 'revert', scope })
      container.querySelector<HTMLElement>('#save')!.click()
      expect(sent.at(-1)?.data).toEqual({ type: 'save', scope })
    } finally {
      root.unmount()
      container.remove()
    }
  }

  connection.close()
})
