// Notifications — Linux leaf. The webview has no direct freedesktop
// Notification API, so delivery goes through the host bridge
// (org.freedesktop.Notifications on the session bus). Without a host —
// browser dev against the same server — the capability reports unsupported.
// The bridge is the dep-free __xplatBridge global, not a platform import.
import type { Capability, NotificationsImpl, PermissionResult } from './types'

const bridge = () => (typeof window !== 'undefined' ? (window as any).__xplatBridge : undefined)

const bridged = () => bridge() !== undefined
const call = <T>(method: string, ...args: unknown[]): Promise<T> =>
	bridge()!.call('notifications', method, args) as Promise<T>

export const notifications: Capability<NotificationsImpl> = {
	get supported() {
		return bridged()
	},
	async ensure(): Promise<PermissionResult> {
		if (!bridged()) {
			return 'unsupported'
		}

		return call<PermissionResult>('ensure')
	},
	impl: {
		notify(title, body) {
			void call('notify', title, body)
		},
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.notifications = () => notifications.ensure()
