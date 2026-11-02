// Semantic checks for native modules; no C compilation or native execution.
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { getToolchain } from 'nim-toolchain'
import { prepareDependencies } from './dependencies.mjs'
import { writeRouteTemplates } from './route-templates.mjs'
const root = resolve(import.meta.dirname, '../..')
writeRouteTemplates(root)
const work = resolve(root, 'research/nim-cli')
const compiler = await getToolchain({ cacheDir: resolve(work, 'toolchain') })
const paths = prepareDependencies(work, compiler)
const selected = process.argv.slice(2)
for (const file of selected.length ? selected : ['args_probe.nim', 'package_probe.nim', 'identity_probe.nim', 'code_probe.nim', 'docs_probe.nim', 'sqlite_probe.nim', 'docs_index_probe.nim', 'tokenizer_probe.nim', 'http_probe.nim', 'process_probe.nim', 'env_probe.nim']) {
 const result = spawnSync(compiler.nim, ['check', ...paths.map(path => `--path:${path}`), `--nimcache:${work}/check-cache`, resolve(import.meta.dirname, file)], { stdio: 'inherit' })
 if (result.status !== 0) process.exit(result.status ?? 1)
}
