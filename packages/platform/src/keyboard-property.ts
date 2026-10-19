/** @internal One numeric host property owned by a keyboard binding. */
export interface KeyboardPropertyLease {
	/** Current owned displacement; a foreign write establishes a new baseline. */
	readonly offset: number
	/** Apply a displacement relative to the baseline, without accumulating frames. */
	set(offset: number): void
	/** Restore the baseline only while the property still holds our last write. */
	release(): void
}

/** Compose keyboard movement with an existing host property. This owns one
 * numeric channel, leaving other transform/style channels untouched. Consumers
 * sharing a host must share the lease; independent bindings must not stack it.
 * @internal */
export function leaseKeyboardProperty(
	read: () => number,
	write: (value: number) => void,
): KeyboardPropertyLease {
	let baseline = read()
	let last: number | undefined
	let offset = 0
	let active = true
	const reconcile = () => {
		const current = read()
		if (last === undefined || current !== last) {
			baseline = current
			last = undefined
			offset = 0
		}
	}
	return {
		get offset() {
			if (!active) {
				return 0
			}
			reconcile()
			return offset
		},
		set(value) {
			if (!active) {
				return
			}
			if (!Number.isFinite(value)) {
				throw new RangeError('Keyboard displacement must be finite')
			}
			reconcile()
			const next = baseline + value
			if (!Number.isFinite(next)) {
				throw new RangeError('Keyboard property baseline must be finite')
			}
			if (next !== read()) {
				write(next)
			}
			last = next
			offset = value
		},
		release() {
			if (!active) {
				return
			}
			active = false
			if (last !== undefined && read() === last) {
				write(baseline)
			}
			last = undefined
			offset = 0
		},
	}
}
