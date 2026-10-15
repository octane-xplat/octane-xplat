export interface SwiftUIHostHandler {
	create(id: string): any
	destroy?(id: string): void
}

export interface SwiftUIHostLifecycle {
	create(id: string): any
	destroy(id: string): void
}

interface SwiftUIHostRegistry {
	handlers: Map<string, SwiftUIHostHandler>
	lifecycle: SwiftUIHostLifecycle
}

function getRegistry(): SwiftUIHostRegistry {
	const global = globalThis as typeof globalThis & {
		__xplatSwiftUIHostRegistry?: SwiftUIHostRegistry
	}
	if (global.__xplatSwiftUIHostRegistry) {
		return global.__xplatSwiftUIHostRegistry
	}

	const handlers = new Map<string, SwiftUIHostHandler>()
	const resolve = (id: string): SwiftUIHostHandler | undefined => {
		let match = ''
		let handler: SwiftUIHostHandler | undefined
		for (const [key, candidate] of handlers) {
			if ((id === key || id.startsWith(`${key}-`)) && key.length > match.length) {
				match = key
				handler = candidate
			}
		}
		return handler
	}

	return (global.__xplatSwiftUIHostRegistry = {
		handlers,
		lifecycle: {
			create: (id) => resolve(id)?.create(id),
			destroy: (id) => resolve(id)?.destroy?.(id),
		},
	})
}

/** Register one SwiftUIManager host id while sharing its process-wide callback. */
export function registerSwiftUIHost(id: string, handler: SwiftUIHostHandler): void {
	getRegistry().handlers.set(id, handler)
}

/** Release a host id when its declaring component unmounts. */
export function unregisterSwiftUIHost(id: string): void {
	getRegistry().handlers.delete(id)
}

/** Pass this same lifecycle object to every SwiftUIManager registration. */
export function getSwiftUIHostLifecycle(): SwiftUIHostLifecycle {
	return getRegistry().lifecycle
}
