// One bounded operation; the native CLI owns publication and process lifetime.
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { planFormat } from './fmt-plan.ts'
import { resolveProjectTool } from './package-root.ts'

const [input, output] = process.argv.slice(2)
const request = JSON.parse(readFileSync(input, 'utf8'))
const response = { protocol: 'octane-build-worker', version: 1, id: request.id }
try {
  if (
    request.protocol !== response.protocol ||
    request.version !== 1 ||
    request.operation !== 'fmt-plan' ||
    request.project !== process.cwd() ||
    !Array.isArray(request.inputs) ||
    !request.inputs.every((path: unknown) => typeof path === 'string')
  ) {
    throw new Error('Invalid format operation request')
  }

  const data = await planFormat(request.project, request.inputs, request.stdin, async () => {
    const entry = resolveProjectTool(request.project, '@octane-xplat/fmt')
    if (!entry) {
      throw new Error(
        'Install @octane-xplat/fmt in the selected project (bun add --dev @octane-xplat/fmt).',
      )
    }
    const { createFormatter } = await import(pathToFileURL(entry).href)
    return createFormatter({ cwd: request.project })
  })

  writeFileSync(output, JSON.stringify({ ...response, ok: true, data }))
} catch (error) {
  writeFileSync(
    output,
    JSON.stringify({
      ...response,
      ok: false,
      error: { message: error instanceof Error ? error.message : String(error) },
    }),
  )

  process.exitCode = 1
}
