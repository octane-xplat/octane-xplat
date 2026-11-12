import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// An installed app/toolchain can supply the compiler without installing this worktree.
const require = createRequire(
  process.env.XPLAT_PRERENDER_TOOLCHAIN_ROOT
    ? join(resolve(process.env.XPLAT_PRERENDER_TOOLCHAIN_ROOT), 'package.json')
    : import.meta.url,
)
const { compile } = await import(pathToFileURL(require.resolve('octane/compiler')).href)
const file = join(import.meta.dirname, 'Home.tsrx')
const result = compile(readFileSync(file, 'utf8'), file, {
  renderer: {
    id: 'nativescript',
    module: 'octane/universal/native',
    target: 'universal',
    server: 'unsupported',
    text: 'host',
  },
})
const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === 'error')
if (errors.length) throw new Error(JSON.stringify(errors))
console.log(JSON.stringify({ file, compiled: true, runtimeQualified: false }))
