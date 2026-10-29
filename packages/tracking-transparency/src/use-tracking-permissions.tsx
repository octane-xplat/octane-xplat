import { useEffect, useLayoutEffect, useMemo, useState } from 'octane'
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from './service'
import type { PermissionHookOptions, PermissionResponse } from './types'

/**
 * Octane [permission, request, refresh] tuple. Mount reads by default and never prompts.
 * Call request from an explicit app action; get:false disables the initial read.
 * @example
 * import { useTrackingPermissions } from '@octane-xplat/tracking-transparency'
 * // Inside an Octane component:
 * const [permission, request, refresh] = useTrackingPermissions()
 */
export function useTrackingPermissions(
	options: PermissionHookOptions = {},
): [
	PermissionResponse | null,
	() => Promise<PermissionResponse>,
	() => Promise<PermissionResponse>,
] {
	if (
		!options ||
		typeof options !== 'object' ||
		Array.isArray(options) ||
		Object.keys(options).some((key) => key !== 'get' && key !== 'request') ||
		(options.get !== undefined && typeof options.get !== 'boolean') ||
		(options.request !== undefined && options.request !== false)
	) {
		throw new TypeError(
			'Tracking prompts require an explicit action; use the returned request function',
		)
	}
	const owner = useMemo(() => ({ active: false, serial: 0, manual: 0, requesting: 0 }), [])
	const [value, setValue] = useState<PermissionResponse | null>(null)
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
				const response = await (request
					? requestTrackingPermissionsAsync()
					: getTrackingPermissionsAsync())
				if (owner.active && serial === owner.serial) {
					setValue(response)
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
			automatic: () => invoke(false, true),
		}
	}, [owner])
	const get = options.get ?? true
	const manualAtRender = owner.manual
	useLayoutEffect(() => {
		owner.active = true
		return () => {
			owner.active = false
			owner.serial++
		}
	}, [owner])
	useEffect(() => {
		// An action between render and this passive effect outranks the default read.
		if (get && owner.manual === manualAtRender && owner.requesting === 0) {
			void methods
				.automatic()
				.catch(() =>
					console.warn(
						'Could not read tracking authorization; call the returned getter to handle the error.',
					),
				)
		}
	}, [owner, get, methods])
	return [value, methods.request, methods.get]
}
