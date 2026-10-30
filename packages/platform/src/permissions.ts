// Runtime permissions — shared dispatcher. The kinds' owners live in leaf
// packages (@octane-xplat/media, /geolocation, /notifications) and register
// their {getPermissions, requestPermissions} pair into the dep-free
// __xplatPermissionOwners global at module scope, so this seam reports
// 'unsupported' when a leaf is absent rather than guessing — same convention
// as __xplatBridge / __xplatAppKit.
import type { PermissionResponse } from '@octane-xplat/lib/capability'
import type { PermissionKind } from './types'

interface Owner {
	getPermissions(): Promise<PermissionResponse>
	requestPermissions(): Promise<PermissionResponse>
}

const UNSUPPORTED: PermissionResponse = {
	status: 'unsupported',
	granted: false,
	canAskAgain: false,
}

const owners = () => ((globalThis as any).__xplatPermissionOwners ??= {}) as Record<string, Owner>

/** Cross-domain permission registry. */
export const permissions = {
	/** Read the permission state without prompting. */
	getPermissions(kind: PermissionKind): Promise<PermissionResponse> {
		return owners()[kind]?.getPermissions() ?? Promise.resolve(UNSUPPORTED)
	},
	/** Request the permission — may show the system dialog. */
	requestPermissions(kind: PermissionKind): Promise<PermissionResponse> {
		return owners()[kind]?.requestPermissions() ?? Promise.resolve(UNSUPPORTED)
	},
}
