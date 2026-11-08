// Private config-dependency registry: qualify this source release before publish.
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { createHash } from 'node:crypto'

const input = JSON.parse(readFileSync(process.argv[2]))
const { ready, requests } = input
const maxRequests = input.maxRequests ?? 32
const packages = (
  input.packages ?? [
    { archive: input.archive, manifest: { name: '@octane-xplat/patches', version: input.version } },
  ]
).map((item, index) => {
  const bytes = readFileSync(item.archive)

  return {
    ...item,
    bytes,
    integrity: 'sha512-' + createHash('sha512').update(bytes).digest('base64'),
    path: input.packages ? `/package-${index}.tgz` : '/patches.tgz',
  }
})

const seen = []
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)

  if (request.method !== 'GET' || seen.length >= maxRequests) {
    response.writeHead(400).end()
    return
  }

  seen.push(path)
  writeFileSync(requests, JSON.stringify(seen))

  const archive = packages.find((item) => item.path === path)
  const item = packages.find((item) => '/' + item.manifest.name === path)

  if (archive) {
    response.writeHead(200, { 'content-type': 'application/octet-stream' }).end(archive.bytes)
  } else if (item) {
    const { name, version } = item.manifest

    response.writeHead(200, { 'content-type': 'application/json' }).end(
      JSON.stringify({
        name,
        'dist-tags': { latest: version },
        time: { [version]: '2020-01-01T00:00:00Z' },
        versions: {
          [version]: {
            ...item.manifest,
            dist: {
              integrity: item.integrity,
              tarball: `http://127.0.0.1:${server.address().port}${item.path}`,
            },
          },
        },
      }),
    )
  } else {
    response.writeHead(404).end()
  }
})

server.requestTimeout = 10000
server.listen(0, '127.0.0.1', () => {
  writeFileSync(
    ready + '.tmp',
    JSON.stringify({ port: server.address().port, integrity: packages[0].integrity }),
  )

  renameSync(ready + '.tmp', ready)
})
