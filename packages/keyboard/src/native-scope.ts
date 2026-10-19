/** @internal Release every owned native resource, including failed attachment. */
export function keyboardNativeScope() {
	let active = true
	const releases: (() => void)[] = []
	return {
		defer(release: () => void) {
			releases.push(release)
		},
		release() {
			if (!active) {
				return
			}
			active = false
			const errors: unknown[] = []
			for (const release of releases.reverse()) {
				try {
					release()
				} catch (error) {
					errors.push(error)
				}
			}
			releases.length = 0
			if (errors.length) {
				throw new AggregateError(errors, 'Keyboard native cleanup failed')
			}
		},
	}
}
