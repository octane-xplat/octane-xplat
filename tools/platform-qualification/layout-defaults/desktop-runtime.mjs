// The fixture assertions are shared with the browser/mobile suite. GJS freezes
// console.error, so desktop qualification records failures without patching it.
export async function runDesktopSuite(suite, adapter, target, emit) {
  const assertions = []
  const measurements = {}
  const cleanups = []
  const errors = []
  const started = Date.now()
  let active = true
  let deadlineTimer
  const ctx = {
    target,
    host: adapter.host,
    mount: (Component, props = {}) => adapter.mount(Component, props),
    find: (id) => adapter.find(id),
    inspect: (id) => adapter.inspect(id),
    assert(name, actual, expected = true) {
      const pass = Object.is(actual, expected)
      assertions.push({ name, actual, expected, pass })
      if (!pass) throw new Error('Assertion failed: ' + name)
    },
    record(name, value) {
      measurements[name] = JSON.parse(JSON.stringify(value))
    },
    onCleanup(callback) {
      cleanups.push(callback)
    },
    async waitFor(predicate, { timeout = 5000, interval = 20 } = {}) {
      const deadline = Date.now() + timeout
      while (active && Date.now() < deadline) {
        const value = await predicate()
        if (value) return value
        await new Promise((resolve) => setTimeout(resolve, interval))
      }
      throw new Error('Desktop layout waitFor timed out')
    },
  }
  try {
    await Promise.race([
      (async () => {
        await adapter.ready?.()
        await suite.run(ctx)
      })(),
      new Promise((_, reject) => {
        deadlineTimer = setTimeout(
          () => reject(new Error('Desktop layout suite timed out')),
          120000,
        )
      }),
    ])
  } catch (error) {
    errors.push({ message: String(error), stack: error.stack ?? null, fatal: true })
  } finally {
    active = false
    clearTimeout(deadlineTimer)
    for (const cleanup of [...cleanups.reverse(), () => adapter.dispose()]) {
      try {
        await cleanup()
      } catch (error) {
        errors.push({ message: String(error), fatal: true })
      }
    }
  }
  const result = {
    schema: 1,
    target,
    case: 'shared-layout-suite/native-' + target,
    host: adapter.identity,
    interaction: 'numeric-geometry-and-programmatic-scroll',
    status: errors.length ? 'fail' : 'pass',
    durationMs: Date.now() - started,
    assertions,
    measurements,
    errors,
  }
  await emit(result)
  return result
}
