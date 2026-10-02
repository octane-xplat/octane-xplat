// Runtime permissions — shared dispatcher. The kinds' owners live in leaf
// packages (@octane-xplat/media, /geolocation, /notifications) and register
// their ensure() into the dep-free __xplatPermissionOwners global at module
// scope, so this seam reports 'unsupported' when a leaf is absent rather
// than guessing — same convention as __xplatBridge / __xplatAppKit.
import type { PermissionKind, PermissionResult } from './types'

type Owner = () => Promise<PermissionResult>
const owners = () => ((globalThis as any).__xplatPermissionOwners ??= {}) as Record<string, Owner>

export const permissions = {
	async ensure(kind: PermissionKind): Promise<PermissionResult> {
		return owners()[kind]?.() ?? 'unsupported'
	},
}
