// The CLI builds platforms/macos and exposes this class through native metadata.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { NotificationsImpl } from './types'
type NativeStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported'
interface NativeNotifications {
	isAvailable(): boolean | number
	getStatus(completion: (result: NativeStatus) => void): void
	ensure(completion: (result: NativeStatus) => void): void
	notifyBody(title: string, body: string): void
}
declare const XplatLocalNotifications: NativeNotifications

const native = (): NativeNotifications | undefined => {
	try {
		if (typeof XplatLocalNotifications === 'undefined') {return}
		const bridge = XplatLocalNotifications
		if (![bridge.isAvailable, bridge.getStatus, bridge.ensure, bridge.notifyBody].every((method) => typeof method === 'function')) {return}
		const available = bridge.isAvailable()
		return available === true || available === 1 ? bridge : undefined
	} catch { return undefined }
}
const response = (raw: string): PermissionResponse => {
	const status: NativeStatus = ['granted', 'denied', 'undetermined'].includes(raw) ? raw as NativeStatus : 'unsupported'
	return { status, granted: status === 'granted', canAskAgain: status === 'granted' || status === 'undetermined' }
}
const permission = (method: 'getStatus' | 'ensure'): Promise<PermissionResponse> => {
	const bridge = native()
	return bridge ? new Promise((resolve) => bridge[method]((status) => resolve(response(status)))) : Promise.resolve(response('unsupported'))
}

/** Local macOS notifications. Reads never substitute an authorization request. */
export const notifications: Permissioned<NotificationsImpl> = {
	get supported() { return native() !== undefined },
	isAvailable: async () => native() !== undefined,
	getPermissions: () => permission('getStatus'),
	requestPermissions: () => permission('ensure'),
	notify(title, body) {
		const bridge = native()
		if (!bridge) {throw new UnavailabilityError('notifications')}
		bridge.notifyBody(title, body ?? '')
	},
}
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.notifications = {
	getPermissions: () => notifications.getPermissions(),
	requestPermissions: () => notifications.requestPermissions(),
}
