// Export maps select the public API; Turbo prepares declarations and tooling.
import { execFile } from 'node:child_process'
import { readdirSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { packageMarkdown } from './api-package.mjs'

if (process.argv[2]) {
  await new Promise((resolve, reject) => {
    packageMarkdown(process.argv[2]).then(
      (markdown) => process.stdout.write(markdown, (error) => (error ? reject(error) : resolve())),
      reject,
    )
  })

  process.exit(0)
}

const execute = promisify(execFile)

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../../..')
const output = join(root, 'docs/api')
const worker = fileURLToPath(import.meta.url)
const pages = []
const controller = new AbortController()

try {
  const entries = readdirSync(join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  async function generate(entry) {
    const manifestPath = join(root, 'packages', entry, 'package.json')
    let manifest

    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    } catch (error) {
      if (error.code === 'ENOENT') {
        return
      }

      throw error
    }

    if (manifest.private) {
      return
    }

    const header = `# ${manifest.name} API\n\n> Generated from the package's exported declarations and TSDoc. Platform setup and usage belong in the [package guide](../packages/package-${entry}.md).\n\n`
    let markdown =
      'This package has no exported TypeScript declarations. See the package guide for its command or asset interface.\n'

    if (manifest.exports || manifest.types || manifest.typings) {
      const result = await execute(process.execPath, [worker, manifestPath], {
        cwd: root,
        signal: controller.signal,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      })

      let fence

      markdown = result.stdout
        .split('\n')
        .map((line) => {
          const marker = line.match(/^\s*(`{3,}|~{3,})/)

          if (marker) {
            if (!fence) {
              fence = marker[1]
            } else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) {
              fence = undefined
            }

            return line
          }

          return fence ? line : line.replace(/^(#{1,5}) /, '$1# ')
        })
        .join('\n')
    }

    pages.push([`api-${entry}.md`, header + markdown])
    console.log(`API: ${manifest.name}`)
  }

  // Bound parallel processes to avoid starting a compiler for every package at once.
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      while (entries.length) {
        await generate(entries.shift())
      }
    }),
  )

  // Replace output only after every package succeeds; failures never publish partial API docs.
  rmSync(output, { recursive: true, force: true })
  mkdirSync(output, { recursive: true })
  for (const [name, markdown] of pages) {
    writeFileSync(join(output, name), markdown)
  }

  console.log(`Generated API reference for ${pages.length} packages`)
} catch (error) {
  controller.abort()
  throw new Error('API documentation generation failed', { cause: error })
}
