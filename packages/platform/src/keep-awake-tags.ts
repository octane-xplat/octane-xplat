import { KeepAwakeDefaultTag, type KeepAwakeImpl } from './keep-awake.types'

/** Serialize transitions so a late activation cannot outlive its cleanup. */
export function createTaggedKeepAwake(backend: {
	available(): boolean | Promise<boolean>
	activate(tag: string): boolean | Promise<boolean>
	deactivate(tag: string): boolean | Promise<boolean>
}): KeepAwakeImpl {
	const tags = new Set<string>()
	let pending = Promise.resolve(true)
	const enqueue = (operation: () => Promise<boolean>) => {
		const result = pending.then(operation, operation).catch(() => false)
		pending = result
		return result
	}

	return {
		activate: (tag = KeepAwakeDefaultTag) =>
			enqueue(async () => {
				if (tags.has(tag)) {
					return true
				}

				if (!(await backend.available()) || !(await backend.activate(tag))) {
					return false
				}

				tags.add(tag)
				return true
			}),
		deactivate: (tag = KeepAwakeDefaultTag) =>
			enqueue(async () => {
				if (!tags.has(tag)) {
					return backend.available()
				}

				if (!(await backend.deactivate(tag))) {
					return false
				}

				tags.delete(tag)
				return true
			}),
		isActivated: () => pending.then(() => tags.size > 0),
		isAvailable: async () => {
			try {
				return await backend.available()
			} catch {
				return false
			}
		},
	}
}
