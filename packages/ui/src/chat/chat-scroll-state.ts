/** @internal One end definition for streaming, keyboard movement and composer growth. */
export const chatAtEnd = (offset: number, max: number, threshold = 10): boolean =>
	Math.max(0, max - offset) <= threshold

export interface ChatScrollControl {
	isFollowing(): boolean
	jumpToEnd(): void
}

const controls = new WeakMap<object, ChatScrollControl[]>()
/** @internal Register the live hook state without requiring a render each frame. */
export function registerChatScrollControl(host: object, control: ChatScrollControl): () => void {
	const readers = controls.get(host) ?? []
	readers.push(control)
	controls.set(host, readers)
	let active = true
	return () => {
		if (!active) {
			return
		}
		active = false
		readers.splice(readers.indexOf(control), 1)
		if (!readers.length) {
			controls.delete(host)
		}
	}
}

export const chatScrollControl = (host: object): ChatScrollControl | undefined =>
	controls.get(host)?.at(-1)

const objectKeys = new WeakMap<object, string>()
let nextObjectKey = 0
/** @internal Preserve existing id-optional data APIs while using stable keyed rows. */
export function chatMessageKey(message: { id?: string }): string {
	if (message.id !== undefined) {
		return `id:${message.id}`
	}
	let key = objectKeys.get(message)
	if (!key) {
		key = `object:${++nextObjectKey}`
		objectKeys.set(message, key)
	}
	return key
}

const rows = new WeakSet<object>()
export const markChatRow = (host: object | null) => {
	if (host) {
		rows.add(host)
	}
}

export const isChatRow = (host: object) => rows.has(host)

const moving = new WeakMap<object, Set<object>>()
/** @internal Suppress a second scroll animation while a keyboard transition owns range. */
export function leaseChatViewportMotion(host: object) {
	const token = {}
	let active = true
	return {
		set(value: boolean) {
			if (!active) {
				return
			}
			const owners = moving.get(host) ?? new Set<object>()
			if (value) {
				owners.add(token)
				moving.set(host, owners)
			} else {
				owners.delete(token)
				if (!owners.size) {
					moving.delete(host)
				}
			}
		},
		release() {
			if (!active) {
				return
			}
			this.set(false)
			active = false
		},
	}
}

export const chatViewportMoving = (host: object) => !!moving.get(host)?.size
