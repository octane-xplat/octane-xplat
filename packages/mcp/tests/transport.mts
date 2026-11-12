// Test transport: records calls and answers from handlers keyed on the
// command path ('session list', 'actions status', ...). A handler is an
// outcome object or a function (call) => outcome.

export function fakeTransport(handlers = {}) {
  const transport = {
    calls: [],
    handlers,
    call: async (call) => {
      transport.calls.push(call)

      const key = call.command.join(' ')
      const handler = handlers[key] ?? handlers['*']

      if (!handler) {
        return {
          ok: false,
          error: { code: 'unavailable', message: `No stubbed xplat response for "${key}".` },
        }
      }

      return typeof handler === 'function' ? handler(call) : handler
    },
  }

  return transport
}

export const ok = (data) => ({ ok: true, data })
export const fail = (code, message, extra = {}) => ({
  ok: false,
  error: { code, message, ...extra },
})

/**
 * A `xplat status --json` data fixture derived from the context's own
 * discovery and binding state — what the Go command computes for the same
 * workspace and --app flag.
 */
export function statusFixture(context, overrides = {}) {
  const { boundApp, discovery } = context
  const selection = boundApp
    ? { state: 'bound', app: boundApp, reason: context.selectionReason }
    : discovery.apps.length === 0
      ? { state: 'none', reason: 'no-apps' }
      : discovery.apps.length === 1
        ? { state: 'bound', app: discovery.apps[0], reason: 'sole-app' }
        : { state: 'ambiguous', candidates: discovery.apps }

  const app = selection.state === 'bound' ? selection.app : null

  return {
    server: { name: '@octane-xplat/cli', version: '0.0.0-test' },
    identity: {
      workspace: discovery.workspace,
      apps: discovery.apps,
      selection,
      framework: app ? { status: 'installed', packages: [] } : null,
    },
    guidance: { sources: [] },
    docs: { state: 'pending' },
    codeIndex: { state: 'pending' },
    prerequisites: [],
    capabilities: [],
    permissions: [],
    boundaries: ['fixture boundary'],
    nextSteps: [],
    ...overrides,
  }
}
