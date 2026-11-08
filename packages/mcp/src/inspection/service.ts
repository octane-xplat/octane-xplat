// Inspection service over the Go `xplat ... --json` agent commands. Inspect
// and interact delegate to the connected app's announced inspector; capture
// has no agent command — the screenshot tool keeps its permission gate and
// reports `unavailable`.

import { contractError } from '../contracts/errors.ts'
import type { InspectionService, WorkspaceContext } from '../context.ts'

export { registerInspectionTools } from './tools.ts'

export function createInspectionService(context: WorkspaceContext): InspectionService {
  const call = context.transport.call

  return {
    inspect: async ({ sessionId, control, offset, limit }) => {
      const permission = await context.policy.require('runtime-actions')
      if (!permission.granted) {
        return { ok: false, error: permission.error }
      }
      return call({
        command: ['inspect'],
        positionals: [sessionId],
        flags: {
          id: control?.kind === 'id' ? control.name : undefined,
          testid: control?.kind === 'testID' ? control.name : undefined,
          offset,
          limit,
        },
      })
    },

    interact: async ({ sessionId, documentId, control, requestKey }) => {
      const permission = await context.policy.require('runtime-actions')
      if (!permission.granted) {
        return { ok: false, error: permission.error }
      }
      return call({
        command: ['interact'],
        positionals: [sessionId],
        flags: {
          document: documentId,
          id: control?.kind === 'id' ? control.name : undefined,
          testid: control?.kind === 'testID' ? control.name : undefined,
          mechanism: 'handler-dispatch',
          'request-key': requestKey,
        },
      })
    },

    screenshot: async () => {
      // The permission gate stays first: even a missing provider never
      // turns capability discovery into an implicit capture grant.
      const grant = await context.policy.require('visual-capture')
      if (!grant.granted) {
        return { ok: false, error: grant.error }
      }
      return {
        ok: false,
        error: contractError(
          'unavailable',
          'No capture command exists in the current agent contract; the owned-browser screenshot path was removed with agent-owned launch.',
          {
            recovery: {
              action: 'Capture the viewport yourself or ask the developer for a screenshot.',
            },
          },
        ),
      }
    },
  }
}
