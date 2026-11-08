// Dev-actions service over `xplat actions ... --json`: the Go dev server owns
// the app-declared registry, admission, dedupe and job outcomes.

import type { DevActionsService, WorkspaceContext } from '../context.ts'
import type { Job } from '../../types/contracts/sessions'

export function createDevActionsService(context: WorkspaceContext): DevActionsService {
  const call = context.transport.call

  return {
    list: () => call({ command: ['actions', 'list'] }),

    invoke: async (_app, args) => {
      const permission = await context.policy.require('runtime-actions')
      if (!permission.granted) {
        return { ok: false, error: permission.error }
      }
      return call({
        command: ['actions', 'invoke'],
        flags: {
          action: args.actionId,
          instance: args.appInstanceId,
          input: JSON.stringify(args.input ?? {}),
          revision: args.registryRevision,
          'request-key': args.requestKey,
        },
      })
    },

    async describeJob(jobId) {
      const result = await call({ command: ['actions', 'status'], positionals: [jobId] })
      if (!result.ok) {
        return null
      }
      return result.data as { job: Job; [key: string]: unknown }
    },
  }
}
