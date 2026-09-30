import { describe, expect, it } from 'vitest'
import { createHostClient, createHostDispatcher } from './host-protocol'

function pairedTransport() {
	const clientListeners = new Set<(message: string) => void>()
	const transport = {
		postMessage(message: string) {
			void dispatcher.dispatch(message)
		},
		listen(listener: (message: string) => void) {
			clientListeners.add(listener)
			return () => clientListeners.delete(listener)
		},
	}

	const dispatcher = createHostDispatcher(
		{
			framework: { read: async () => 'native value' },
			application: { format: (value: string, count: number) => `${value}:${count}` },
		},
		{
			reply(message) {
				for (const listener of clientListeners) {
					listener(message)
				}
			},
			emit(message) {
				for (const listener of clientListeners) {
					listener(message)
				}
			},
		},
	)

	return { transport, dispatcher }
}

describe('desktop host bridge', () => {
	it('calls framework and application services and discovers available methods', async () => {
		const { transport } = pairedTransport()
		const client = createHostClient<{
			framework: { read(): Promise<string> }
			application: { format(value: string, count: number): string }
		}>(transport)

		expect(await client.call('framework', 'read')).toBe('native value')
		expect(await client.call('application', 'format', 'rows', 3)).toBe('rows:3')
		expect(await client.capabilities()).toEqual({
			framework: ['read'],
			application: ['format'],
		})
	})

	it('delivers typed events and rejects unavailable methods', async () => {
		const { transport, dispatcher } = pairedTransport()
		const client = createHostClient<object, { 'application.ready': { version: number } }>(transport)
		const ready = new Promise<{ version: number }>((resolve) => {
			client.on('application.ready', resolve)
		})

		dispatcher.emit('application.ready', { version: 1 })
		expect(await ready).toEqual({ version: 1 })
		await expect(client.call('framework', 'missing')).rejects.toThrow(
			'desktop host has no framework.missing service',
		)
	})

	it('releases event listeners and rejects pending calls when disposed', async () => {
		let receive!: (message: string) => void
		let listening = false
		const transport = {
			postMessage() {},
			listen(listener: (message: string) => void) {
				receive = listener
				listening = true
				return () => {
					listening = false
				}
			},
		}

		const client = createHostClient<object, { changed: string }>(transport)
		let events = 0
		client.on('changed', () => events++)
		const pending = client.call('framework', 'never-replied')
		client.dispose()
		receive(JSON.stringify({ type: 'event', name: 'changed', payload: 'late' }))

		expect(events).toBe(0)
		expect(listening).toBe(false)
		await expect(pending).rejects.toThrow('desktop host client is disposed')
		await expect(client.capabilities()).rejects.toThrow('desktop host client is disposed')
	})
})
