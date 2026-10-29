import { useEffect, useLayoutEffect, useMemo, useState } from 'octane'
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
	const owner = useMemo(
		() => ({ active: false, serial: 0, manual: 0, requesting: 0 }),
		[writeOnly, key],
	)
	const [value, setValue] = useState<{ owner: typeof owner; response: PermissionResponse } | null>(
		null,
	)
	const methods = useMemo(() => {
		const invoke = async (request: boolean, automatic = false) => {
			if (!automatic) {
				owner.manual++
			}
			const serial = ++owner.serial
			if (request) {
				owner.requesting++
			}
			try {
				const response = await (request ? requestPermissionsAsync : getPermissionsAsync)(
					writeOnly,
					granular,
				)
				if (owner.active && serial === owner.serial) {
					setValue({ owner, response })
				}
				return response
			} finally {
				if (request) {
					owner.requesting--
				}
			}
		}
		return {
			request: () => invoke(true),
			get: () => invoke(false),
			automatic: (request: boolean) => invoke(request, true),
		}
	}, [owner])
	const get = options.get ?? true
	const request = options.request ?? false
	const manualAtRender = owner.manual
	useLayoutEffect(() => {
		owner.active = true
		return () => {
			owner.active = false
			owner.serial++
		}
	}, [owner])
	useEffect(() => {
		if (
			MediaLibrary.supported &&
			(get || request) &&
			owner.manual === manualAtRender &&
			owner.requesting === 0
		) {
			void methods
				.automatic(request)
				.catch((error) => console.error('Could not read media-library permissions', error))
		}
	}, [owner, get, request, methods])
	return [value?.owner === owner ? value.response : null, methods.request, methods.get]
}
