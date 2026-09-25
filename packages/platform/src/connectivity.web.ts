// Connectivity — web leaf. Online state comes from navigator.onLine and
// changes are delivered through the browser's online/offline events.
import type { ConnectionType, ConnectivityImpl, ConnectivityState } from './types'

const listeners = new Set<(state: ConnectivityState) => void>()

function connectionType(): ConnectionType {
	const type = (navigator as Navigator & { connection?: { type?: string } }).connection?.type
	switch (type) {
		case 'wifi':
			return 'wifi'
		case 'cellular':
			return 'mobile'
		case 'ethernet':
			return 'ethernet'
		case 'bluetooth':
			return 'bluetooth'
		case 'vpn':
			return 'vpn'
		default:
			return navigator.onLine ? 'unknown' : 'none'
	}
}

function read(): ConnectivityState {
	return { online: navigator.onLine, type: connectionType() }
}

function notify() {
	const state = read()
	for (const listener of listeners) {
		listener(state)
	}
}

function addListeners() {
	window.addEventListener('online', notify)
	window.addEventListener('offline', notify)
}

function removeListeners() {
	window.removeEventListener('online', notify)
	window.removeEventListener('offline', notify)
}

export const connectivity: ConnectivityImpl = {
	getState: read,
	subscribe(listener) {
		if (listeners.size === 0) {
			addListeners()
		}

		listeners.add(listener)
		listener(read())
		return () => {
			listeners.delete(listener)
			if (listeners.size === 0) {
				removeListeners()
			}
		}
	},
}
