// Selected-project devtools operations; native callers own selection and service lifetime.
import { Console } from 'node:console'
import { lstatSync, realpathSync, statSync, writeFileSync, renameSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, sep, basename } from 'node:path'
import { pathToFileURL } from 'node:url'

// The devtools package may be a direct project install or ride inside the
// octane-xplat umbrella (Bun isolated layouts hide transitive deps from the
// project root). Walk ancestors for either anchor and resolve desktop-node
// through the anchor's own package so each layout's visibility rules apply.
export function devtoolsEntry(project: string): string {
  for (let at = project; ; at = dirname(at)) {
    for (const anchor of ['@octane-xplat/devtools', 'octane-xplat']) {
      const host = join(at, 'node_modules', anchor)
      let found = false

      try {
        lstatSync(host)
        found = true
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error
        }
      }

      if (!found) {
        continue
      }

      const require = createRequire(join(host, 'package.json'))
      let root: string
      let entry: string

      try {
        root = dirname(realpathSync(require.resolve('@octane-xplat/devtools/package.json')))
        entry = realpathSync(require.resolve('@octane-xplat/devtools/desktop-node'))
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
          continue // an octane-xplat without the devtools dep — keep looking
        }

        throw error
      }

      if (!entry.startsWith(root + sep) || !statSync(entry).isFile()) {
        throw new Error(
          'Reinstall @octane-xplat/devtools: its desktop launcher must remain inside the selected package',
        )
      }

      return entry
    }

    if (dirname(at) === at) {
      break
    }
  }

  throw new Error('Install octane-xplat in the selected project: bun add -D octane-xplat')
}

// A receipt admits the operation; it never claims host or panel readiness.
export async function devtoolsDesktopService(
  request: Record<string, any>,
  requestFile: string,
  resultFile: string,
) {
  const project = realpathSync(process.cwd())

  if (request.target !== 'macos') {
    throw new Error('Unsupported devtools target')
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

  const api = await import(pathToFileURL(devtoolsEntry(project)).href)

  if (api.DEVTOOLS_DESKTOP_LIFECYCLE_VERSION !== 1) {
    throw new Error(
      'Update @octane-xplat/devtools in the selected project to provide desktop lifecycle v1',
    )
  }

  const data = {
    version: 1,
    project,
    operation: 'devtools-desktop',
    target: 'macos',
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

  await api.devtoolsDesktop({
    cwd: project,
    resourceRoot: request.resourceRoot,
    profileRoot: request.profileRoot || undefined,
    onStarted: ({ kind, pid, url }: { kind: string; pid?: number; url?: string }) => {
      const value = JSON.stringify({
        protocol: 'octane-project-service',
        version: 1,
        id: request.id,
        project,
        operation: 'devtools-desktop',
        target: 'macos',
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
