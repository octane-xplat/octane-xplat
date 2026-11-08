// Selected-project workshop operations; native callers own selection and service lifetime.
import { Console } from 'node:console'
import { lstatSync, realpathSync, statSync, writeFileSync, renameSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, sep, basename } from 'node:path'
import { Writable } from 'node:stream'
import { pathToFileURL } from 'node:url'

function workshopEntry(project: string): string {
  const require = createRequire(join(project, 'package.json'))

  for (let at = project; ; at = dirname(at)) {
    const candidate = join(at, 'node_modules/@octane-xplat/workshop')
    let found = false

    try {
      lstatSync(candidate)
      found = true
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    if (found) {
      const root = realpathSync(candidate)
      const entry = realpathSync(require.resolve('@octane-xplat/workshop/node'))

      if (!entry.startsWith(root + sep) || !statSync(entry).isFile()) {
        throw new Error(
          'Reinstall @octane-xplat/workshop: its Node entry must remain inside the selected package',
        )
      }

      return entry
    }

    if (dirname(at) === at) {
      break
    }
  }

  throw new Error(
    'Install @octane-xplat/workshop in the selected project: bun add -D @octane-xplat/workshop',
  )
}

export async function workshopInspection(request: Record<string, any>) {
  if (
    typeof request.json !== 'boolean' ||
    !['workshop-list', 'workshop-doctor'].includes(request.operation)
  ) {
    throw new Error('Invalid workshop inspection request')
  }

  if (
    request.operation === 'workshop-list' &&
    (typeof request.target !== 'string' || request.target.length > 128)
  ) {
    throw new Error('Expected workshop target string')
  }

  const project = realpathSync(process.cwd())
  const api = await import(pathToFileURL(workshopEntry(project)).href)
  const previous = globalThis.console
  const chunks: Buffer[] = []
  let size = 0
  const output = new Writable({
    write(chunk, _encoding, callback) {
      size += chunk.length
      if (size <= 8 * 1024 * 1024) {
        chunks.push(Buffer.from(chunk))
      }

      callback()
    },
  })

  globalThis.console = new Console({ stdout: output, stderr: process.stderr })
  try {
    const result =
      request.operation === 'workshop-list'
        ? await api.workshopList({ cwd: project, target: request.target, json: request.json })
        : await api.workshopDoctor({ cwd: project, json: request.json })

    if (size > 8 * 1024 * 1024) {
      throw new Error('Workshop inspection output exceeds 8 MiB')
    }

    const resultJSON =
      request.operation === 'workshop-list' ? { target: request.target, ...result } : result

    if (request.json) {
      // The API prints its JSON as its final log. Preserve earlier loader/config
      // diagnostics on stderr without replaying the machine result there.
      const text = Buffer.concat(chunks).toString('utf8')
      const printed = JSON.stringify(resultJSON, null, 2) + '\n'

      process.stderr.write(text.endsWith(printed) ? text.slice(0, -printed.length) : text)
    }

    return {
      version: 1,
      project,
      operation: request.operation,
      exitCode: 0,
      stdout: request.json ? '' : Buffer.concat(chunks).toString('utf8'),
      result: resultJSON,
    }
  } catch (error) {
    if (request.json || error?.name !== 'WorkshopUsageError') {
      process.stderr.write(Buffer.concat(chunks).toString('utf8'))
    }

    if (error?.name !== 'WorkshopUsageError') {
      throw error
    }

    if (size > 8 * 1024 * 1024) {
      throw new Error('Workshop inspection output exceeds 8 MiB')
    }

    return {
      version: 1,
      project,
      operation: request.operation,
      exitCode: 1,
      stdout: request.json ? '' : Buffer.concat(chunks).toString('utf8'),
      error: error.message,
      result: null,
    }
  } finally {
    globalThis.console = previous
  }
}

export async function workshopInitPlan(request: Record<string, any>) {
  if (typeof request.scripts !== 'boolean') {
    throw new Error('Expected scripts boolean')
  }

  const project = realpathSync(process.cwd())
  const api = await import(pathToFileURL(workshopEntry(project)).href)

  if (typeof api.planWorkshopInit !== 'function') {
    throw new Error(
      'Update @octane-xplat/workshop in the selected project to provide initialization plan v1',
    )
  }

  return api.planWorkshopInit({ cwd: project, scripts: request.scripts })
}

// A receipt admits the operation; it never claims app readiness or completion.
export async function workshopService(
  request: Record<string, any>,
  requestFile: string,
  resultFile: string,
) {
  const project = realpathSync(process.cwd())

  if (!['web', 'macos', 'linux', 'ios', 'android', 'windows'].includes(request.target)) {
    throw new Error('Unsupported workshop target')
  }

  for (const key of ['story', 'device']) {
    if (
      request[key] !== undefined &&
      (typeof request[key] !== 'string' || request[key].length > 8192)
    ) {
      throw new Error(`Invalid workshop ${key}`)
    }
  }

  if (
    request.port !== undefined &&
    (!Number.isInteger(request.port) || request.port < 0 || request.port > 65535)
  ) {
    throw new Error('Workshop port must be an integer from 0 to 65535')
  }

  const directory = realpathSync(dirname(requestFile))

  if (
    dirname(request.serviceStateFile) !== directory ||
    basename(request.serviceStateFile) !== 'service.json' ||
    request.resourceRoot !== join(directory, 'resources')
  ) {
    throw new Error('Invalid native-owned service paths')
  }

  if (
    request.profileRoot !== '' &&
    (!request.profileRoot.startsWith(project + sep) ||
      !basename(request.profileRoot).startsWith('.xplat-go-profile-') ||
      !lstatSync(request.profileRoot).isDirectory())
  ) {
    throw new Error('Invalid native-owned compiler profile')
  }

  globalThis.console = new Console({ stdout: process.stdout, stderr: process.stderr })

  const api = await import(pathToFileURL(workshopEntry(project)).href)

  if (api.WORKSHOP_DEV_LIFECYCLE_VERSION !== 1) {
    throw new Error(
      'Update @octane-xplat/workshop in the selected project to provide development lifecycle v1',
    )
  }

  const data = {
    version: 1,
    project,
    operation: 'workshop-dev',
    target: request.target,
    state: 'accepted',
  }

  writeFileSync(
    resultFile,
    JSON.stringify({
      protocol: request.protocol,
      version: request.version,
      id: request.id,
      ok: true,
      data,
      warnings: [],
    }),
  )

  await api.workshopDev({
    cwd: project,
    target: request.target,
    story: request.story,
    port: request.port,
    device: request.device,
    resourceRoot: request.resourceRoot,
    profileRoot: request.profileRoot || undefined,
    onStarted: ({ kind, pid, url }) => {
      const value = JSON.stringify({
        protocol: 'octane-project-service',
        version: 1,
        id: request.id,
        project,
        operation: 'workshop-dev',
        target: request.target,
        kind,
        pid,
        url,
      })

      if (Buffer.byteLength(value) > 65536) {
        throw new Error('Service startup evidence exceeds 64 KiB')
      }

      writeFileSync(request.serviceStateFile + '.next', value, { mode: 0o600 })
      renameSync(request.serviceStateFile + '.next', request.serviceStateFile)
    },
  })

  return data
}

/** Selected-project finite static build. No development service is started. */
export async function workshopBuildOperation(request: Record<string, unknown>) {
  if (
    request.target !== 'web' ||
    typeof request.outDir !== 'string' ||
    typeof request.base !== 'string'
  ) {
    throw new Error('Invalid Workshop build request')
  }

  const project = realpathSync(process.cwd())
  const api = await import(pathToFileURL(workshopEntry(project)).href)

  if (typeof api.workshopBuild !== 'function') {
    throw new Error('Update @octane-xplat/workshop to build static previews')
  }

  const result = await api.workshopBuild({
    cwd: project,
    target: 'web',
    outDir: request.outDir,
    base: request.base,
  })

  return { version: 1, project, operation: 'workshop-build', ...result }
}
