/** A redirect shares its request with the original stack. Claiming another
 * stack supersedes its pending navigation without reviving a stale request. */
export interface NavigationRequest {
	isCurrent(): boolean
	claim(stack: string): boolean
}

export function createNavigationRequests() {
	const versions = new Map<string, number>()
	const invalidate = (stack: string) => {
		const version = (versions.get(stack) ?? 0) + 1
		versions.set(stack, version)
		return version
	}

	return {
		invalidate,
		begin(stack: string): NavigationRequest {
			const owned = new Map([[stack, invalidate(stack)]])
			const isCurrent = () => [...owned].every(([name, version]) => versions.get(name) === version)
			return {
				isCurrent,
				claim(name: string) {
					if (!isCurrent()) {
						return false
					}

					if (!owned.has(name)) {
						owned.set(name, invalidate(name))
					}

					return true
				},
			}
		},
	}
}
