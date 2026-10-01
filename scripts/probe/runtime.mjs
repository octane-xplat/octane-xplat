export const marker = '[xplat-probe] '

const describe = (error) => ({
	message: error?.message ?? String(error),
	stack: error?.stack ?? null,
})

export async function executeCase(
	probe,
	adapter,
	options,
	emit = (result) => console.log(marker + JSON.stringify(result)),
) {
	const started = Date.now()
	const assertions = []
	const measurements = Object.create(null)
	const errors = []
	const cleanups = []
	let active = true
	let cancelled = false
	let timer
	const reportError = (error) => {
		errors.push(describe(error))
	}

	const originalError = console.error
	console.error = (...args) => {
		reportError(new Error(args.map((value) => value?.message ?? String(value)).join(' ')))
		originalError(...args)
	}

	const cancel = () => {
		cancelled = true
		active = false
	}

	const guard =
		(callback) =>
		(...args) => {
			if (!active) {
				throw new Error('Probe is no longer active')
			}

			return callback(...args)
		}

	const context = {
		target: options.target,
		host: adapter.host,
		mount: guard((Component, props = {}) => adapter.mount(Component, props)),
		find: guard((id) => adapter.find(id)),
		press: guard((id) => adapter.press(id)),
		setText: guard((id, value) => adapter.setText(id, value)),
		inspect: guard((id) => adapter.inspect(id)),
		assert(name, actual, expected = true) {
			if (!active) {
				throw new Error('Probe is no longer active')
			}

			const pass = Object.is(actual, expected)
			assertions.push(JSON.parse(JSON.stringify({ name, pass, actual, expected })))
			if (!pass) {
				throw new Error('Assertion failed: ' + name)
			}
		},
		record(name, value) {
			if (!active) {
				throw new Error('Probe is no longer active')
			}

			// Reject circular/native values before they can corrupt completion output.
			measurements[name] = JSON.parse(JSON.stringify(value))
		},
		onCleanup(callback) {
			if (!active) {
				throw new Error('Probe is no longer active')
			}

			cleanups.push(callback)
		},
		async waitFor(predicate, { timeout = options.timeout, interval = 20 } = {}) {
			const deadline = Date.now() + timeout
			while (active && Date.now() < deadline) {
				const value = await predicate()
				if (value) {
					return value
				}

				await new Promise((resolve) => setTimeout(resolve, interval))
			}

			throw new Error(active ? 'Probe waitFor timed out' : 'Probe cancelled')
		},
	}

	adapter.onError?.(reportError)
	adapter.onCancel?.(cancel)
	try {
		await Promise.race([
			(async () => {
				await adapter.ready?.()
				if (!active) {
					throw new Error('Probe is no longer active')
				}

				if (typeof probe.default === 'function') {
					await context.mount(probe.default)
				}

				if (typeof probe.run !== 'function') {
					throw new Error('Probe must export an async run(context) function')
				}

				await probe.run(context)
			})(),
			new Promise((_, reject) => {
				timer = setTimeout(() => reject(new Error('Probe timed out')), options.timeout)
			}),
		])
	} catch (error) {
		reportError(error)
	} finally {
		active = false
		clearTimeout(timer)
		for (const cleanup of [...cleanups.reverse(), () => adapter.dispose()]) {
			try {
				let cleanupTimer
				try {
					await Promise.race([
						Promise.resolve().then(cleanup),
						new Promise((_, reject) => {
							cleanupTimer = setTimeout(() => reject(new Error('Probe cleanup timed out')), 1000)
						}),
					])
				} finally {
					clearTimeout(cleanupTimer)
				}
			} catch (error) {
				reportError(error)
			}
		}

		console.error = originalError
	}

	if (cancelled) {
		return
	}

	const result = {
		schema: 1,
		runId: options.runId,
		case: options.case,
		target: options.target,
		host: adapter.identity,
		interaction: adapter.interaction,
		status: errors.length ? 'fail' : 'pass',
		durationMs: Date.now() - started,
		assertions,
		measurements,
		errors,
	}

	await emit(result)
	return result
}
