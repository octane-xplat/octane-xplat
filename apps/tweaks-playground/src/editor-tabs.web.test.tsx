/** @jsxImportSource @octane-xplat/jsx/dom */
import { expect, it, vi } from 'vitest'
import { createRoot } from 'octane'
import { connectDevtools } from '@octane-xplat/devtools/client'
import { App, type DevSocket, type DevtoolsServerRecord } from '@octane-xplat/devtools/panel'
import { TweaksPanel, StylesPanel } from '../../../packages/tweaks/src/devtools/Panel.tsrx'

const record: DevtoolsServerRecord = {
  endpoint: 'http://127.0.0.1:5200/rpc',
  instanceId: 'a'.repeat(32),
  devtoolsToken: 'b'.repeat(64),
  appRoot: '/fixture',
}
const ready = { type: 'ready', panel: 'p', backends: [{ channel: 'tweaks', targetId: 'web' }] }

function panelSocket() {
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

  return { sent, socket: () => socket, emit, isListening: () => socket.onmessage !== null }
}

it('renders separate editors and scopes their save and revert actions', async () => {
  const { sent, socket, emit } = panelSocket()
  const connection = connectDevtools(record, { socket })

  emit(ready)

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

it('resubscribes the open editor when the shared panel gets a new socket', async () => {
  const first = panelSocket()
  const second = panelSocket()
  const container = document.createElement('div')
  const plugins = [{ id: 'tweaks', title: 'Tweaks', Panel: TweaksPanel }]

  document.body.append(container)
  const root = createRoot(container)

  try {
    root.render(App, { record, socket: first.socket, plugins, initialTab: 'tweaks' })
    await vi.waitFor(() => expect(first.isListening()).toBe(true))
    first.emit(ready)
    await vi.waitFor(() => expect(first.sent.at(-1)?.data?.type).toBe('hello'))

    root.render(App, { record, socket: second.socket, plugins, initialTab: 'sessions' })
    await vi.waitFor(() => expect(second.isListening()).toBe(true))
    second.emit(ready)
    await vi.waitFor(() => expect(second.sent.at(-1)?.data?.type).toBe('hello'))
    expect(container.querySelector('.dt-tab-active')?.textContent).toBe('Tweaks')
  } finally {
    root.unmount()
    container.remove()
  }
})
