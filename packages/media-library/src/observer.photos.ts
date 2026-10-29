import type { EventSubscription } from './types'

type Observer = { callback?: () => void }
type Constructor = { new: () => Observer }
type NativeBase = {
	extend(
		methods: { photoLibraryDidChange(this: Observer): void },
		options: { name: string; protocols: unknown[] },
	): Constructor
}

/** Native metadata omits NSObject.extend; keep that bridge assertion in one place. */
export function observerFactory(
	base: unknown,
	protocol: unknown,
	name: string,
	queue: (callback: () => void) => void,
	register: (observer: Observer) => void,
	unregister: (observer: Observer) => void,
): (listener: () => void) => EventSubscription {
	const Type = (base as NativeBase).extend(
		{
			photoLibraryDidChange() {
				queue(() => this.callback?.())
			},
		},
		{ name, protocols: [protocol] },
	)
	return (listener) => {
		const instance = Type.new()
		instance.callback = listener
		register(instance)
		let active = true
		return {
			remove() {
				if (!active) {
					return
				}
				active = false
				instance.callback = undefined
				unregister(instance)
			},
		}
	}
}
