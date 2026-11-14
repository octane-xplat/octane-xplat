import { run as shared } from './conformance.ts'
import { events, installNode } from '../dist/index.js'

type Context = Parameters<typeof shared>[0]
type Host = typeof globalThis & { __nativeRequire?: unknown; require?: (name: string) => unknown }

export async function run(ctx: Context) {
  await shared(ctx)

  const host: Host = globalThis

  ctx.record('nativeRequireHook', typeof host.__nativeRequire)
  if (typeof host.__nativeRequire === 'function') {
    installNode()
    ctx.assert(
      'native require reaches module registry',
      host.require?.('node:events') === events,
      true,
    )
  }
}
