// Installed only by the explicit native development plugin. Serialize this fixed
// operation, never caller-provided expressions. It has no imports at runtime.
export function installDevInspector(inspectDOM) {
  const scope = globalThis as unknown as Record<string, any>
  const key = 'octane-xplat.dev-inspector'

  if (!scope.document || scope[key]) {
    return
  }

  const documentId = `doc_${scope.crypto.randomUUID()}`

  scope[key] = {
    version: 1,
    documentId,

    interact(args) {
      const control = args?.control

      if (
        !args ||
        Object.keys(args).some(
          (key) => !['documentId', 'control', 'mechanism', 'expiresAt'].includes(key),
        ) ||
        !control ||
        !['id', 'testID'].includes(control.kind) ||
        typeof control.name !== 'string' ||
        !control.name ||
        control.name.length > 256 ||
        args.mechanism !== 'handler-dispatch' ||
        !Number.isSafeInteger(args.expiresAt)
      ) {
        return {
          error: { code: 'invalid_selection', message: 'Invalid named-host interaction request.' },
          outcome: 'not-run',
        }
      }

      if (args.documentId !== documentId) {
        return {
          error: { code: 'stale_identity', message: 'The document changed; inspect again.' },
          outcome: 'not-run',
        }
      }

      if (Date.now() >= args.expiresAt) {
        return {
          error: { code: 'unavailable', message: 'Interaction delivery expired before dispatch.' },
          outcome: 'not-run',
        }
      }

      const select = () =>
        [...scope.document.querySelectorAll('[id],[data-testid]')].filter(
          (element) =>
            (control.kind === 'id' ? element.id : element.getAttribute('data-testid')) ===
            control.name,
        )

      const selected = select()
      const before = inspectDOM({ control, offset: 0, limit: 1, focus: false })

      if (before.error) {
        return { ...before, outcome: 'not-run' }
      }

      const host = before.controls[0]

      if (!host || host.hidden || host.disabled || host.sensitive || !host.hitTarget) {
        return {
          error: {
            code: 'unavailable',
            message: 'Control is hidden, disabled, private or obscured; no input was sent.',
          },
          outcome: 'not-run',
        }
      }

      const current = select()

      if (
        selected.length !== 1 ||
        current.length !== 1 ||
        current[0] !== selected[0] ||
        !current[0].isConnected
      ) {
        return {
          error: {
            code: 'stale_identity',
            message: 'The selected host changed before dispatch; inspect again.',
          },
          outcome: 'not-run',
        }
      }

      if (!(current[0] instanceof scope.HTMLElement)) {
        return {
          error: {
            code: 'unsupported_capability',
            message: 'Handler dispatch requires an HTML host.',
          },
          outcome: 'not-run',
        }
      }

      if (Date.now() >= args.expiresAt) {
        return {
          error: { code: 'unavailable', message: 'Interaction delivery expired before dispatch.' },
          outcome: 'not-run',
        }
      }

      try {
        scope.HTMLElement.prototype.click.call(current[0])
      } catch {
        return {
          error: {
            code: 'execution_failure',
            message: 'Handler dispatch threw; effects are unknown.',
          },
          outcome: 'unknown',
        }
      }

      return {
        documentId,
        ...before,
        inputSent: true,
        mechanism: 'handler-dispatch',
        eventTrusted: false,
        assertion: 'Programmatic click dispatch only; inspect the intended app state separately.',
      }
    },

    inspect(args) {
      const offset = args?.offset ?? 0
      const limit = args?.limit ?? 20
      const control = args?.control

      if (
        !args ||
        Object.keys(args).some((key) => !['offset', 'limit', 'control'].includes(key)) ||
        !Number.isSafeInteger(offset) ||
        offset < 0 ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100 ||
        (control !== undefined &&
          (!control ||
            !['id', 'testID'].includes(control.kind) ||
            typeof control.name !== 'string' ||
            !control.name ||
            control.name.length > 256))
      ) {
        return {
          error: { code: 'invalid_selection', message: 'Invalid named-host inspection request.' },
        }
      }

      // Inspection never focuses a control or dispatches input.
      const result = inspectDOM({ control, offset, limit, focus: false })

      return result.error ? result : { documentId, ...result }
    },
  }
}
