import { useEffect, useMemo, useState } from 'octane'
import { getPermissionsAsync, requestPermissionsAsync, MediaLibrary } from './core'
import type { PermissionHookOptions, PermissionResponse } from './types'

/** Read without prompting on mount; call the returned request function from an app action. */
export function usePermissions(
	options: PermissionHookOptions = {},
): [
	PermissionResponse | null,
	() => Promise<PermissionResponse>,
	() => Promise<PermissionResponse>,
] {
	const writeOnly = options.writeOnly ?? false
	const granular =
		options.granularPermissions === undefined
			? undefined
			: [...new Set(options.granularPermissions)].sort()
	const key = granular?.join(',')
	const owner = useMemo(() => ({ active: false, serial: 0 }), [writeOnly, key])
	const [value, setValue] = useState<{ owner: typeof owner; response: PermissionResponse } | null>(
		null,
	)
	const methods = useMemo(() => {
		const invoke = async (request: boolean) => {
			const serial = ++owner.serial
			const response = await (request ? requestPermissionsAsync : getPermissionsAsync)(
				writeOnly,
				granular,
			)
			if (owner.active && serial === owner.serial) {
				setValue({ owner, response })
			}
			return response
		}
		return { request: () => invoke(true), get: () => invoke(false) }
	}, [owner])
	const get = options.get ?? true
	const request = options.request ?? false
	useEffect(() => {
		owner.active = true
		if (MediaLibrary.supported && (get || request)) {
			void (request ? methods.request() : methods.get()).catch((error) =>
				console.error('Could not read media-library permissions', error),
			)
		}
		return () => {
			owner.active = false
			owner.serial++
		}
	}, [owner, get, request, methods])
	return [value?.owner === owner ? value.response : null, methods.request, methods.get]
}
