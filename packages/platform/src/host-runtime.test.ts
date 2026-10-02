import { describe, expect, it, vi } from 'vitest'
import { createHostDispatcher } from './host-protocol'
import type { FrameworkHostEvents, FrameworkHostServices } from './host-services'
import { desktopHost, desktopHostBootstrap, desktopHostSupports } from './host-runtime.web'

const services: FrameworkHostServices = {
	app: {
		getInfo: () => ({ supported: true, version: '1.0', build: '2', bundleId: 'app.test' }),
		getState: () => 'active',
		getWindowSize: () => ({ width: 800, height: 600, orientation: 'landscape' }),
		consumeInitialUrl: () => null,
	},
	clipboard: {
		read: async () => 'clipboard text',
		write: async () => true,
	},
	files: {
		pick: async (accept, options) => ({
			name: `${accept}-${options?.startingFolder ?? 'none'}.txt`,
			uri: 'file:///tmp/test.txt',
		}),
		readText: async (uri) => `text:${uri}`,
		writeText: async (name) => ({ name, uri: `file:///tmp/${name}` }),
	},
	notifications: {
		ensure: async () => 'granted',
		notify: async () => true,
	},
	secureStorage: {
		get: async (key) => `secret:${key}`,
		set: async () => true,
		remove: async () => true,
	},
	appearance: {
		get: async () => 'dark',
	},
	windows: {
		open: async (options) => String(options.id ?? 'window'),
		close: async () => true,
		setTitle: async () => true,
	},
	system: {
		openUrl: async () => true,
		openPath: async () => true,
		shareContent: async () => 'shared',
	},
	storage: {
		get: async (key) => `storage:${key}`,
		set: async () => {},
		remove: async () => {},
	},
}

describe('desktop host facade', () => {
	it('exposes typed framework services, capabilities, bootstrap, and events', async () => {
		const listeners = new Set<(message: string) => void>()
		const dispatcher = createHostDispatcher<FrameworkHostServices, FrameworkHostEvents>(services, {
			reply: (message) => {
				for (const listener of listeners) {
					listener(message)
				}
			},
			emit: (message) => {
				for (const listener of listeners) {
					listener(message)
				}
			},
		})

		vi.stubGlobal('window', {
			webkit: {
				messageHandlers: {
					xplat: { postMessage: (message: string) => void dispatcher.dispatch(message) },
				},
			},
			__xplatHostTransport: {
				receive(message: string) {
					for (const listener of listeners) {
						listener(message)
					}
				},
				listen(listener: (message: string) => void) {
					listeners.add(listener)
					return () => listeners.delete(listener)
				},
			},
			__xplatHostSnapshot: {
				appInfo: { supported: true, version: '1.0', build: '2', bundleId: 'app.test' },
				initialUrl: null,
				colorScheme: 'dark',
			},
		})

		const host = desktopHost()
		expect(host).not.toBeNull()
		expect(desktopHostBootstrap()?.colorScheme).toBe('dark')
		expect(await desktopHostSupports('files', 'readText')).toBe(true)
		expect(await host!.clipboard.read()).toBe('clipboard text')
		expect(await host!.files.pick('.txt', { startingFolder: '/tmp' })).toEqual({
			name: '.txt-/tmp.txt',
			uri: 'file:///tmp/test.txt',
		})

		expect(await host!.secureStorage.get('token')).toBe('secret:token')
		expect(await host!.windows.open({ id: 'secondary' })).toBe('secondary')
		expect(await host!.system.openPath('/tmp/test.txt')).toBe(true)

		const closed = vi.fn()
		host!.on('windows.closed', closed)
		dispatcher.emit('windows.closed', 'secondary')
		expect(closed).toHaveBeenCalledWith('secondary')
		host!.dispose()
	})
})
