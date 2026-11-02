// Focused native iteration after the initial Turbo build prepared metadata.
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { getToolchain } from 'nim-toolchain'
import { prepareDependencies } from './dependencies.mjs'
import { readFileSync, writeFileSync } from 'node:fs'
import { writeRouteTemplates } from './route-templates.mjs'
import { httpProbeInputs, processProbeInputs, envProbeInputs, artifactFingerprint } from './native-inputs.mjs'
const probes = { http: { entry: 'http_probe.nim', inputs: httpProbeInputs }, process: { entry: 'process_probe.nim', inputs: processProbeInputs }, env: { entry: 'env_probe.nim', inputs: envProbeInputs } }
const selected = process.argv[2]
if (!Object.hasOwn(probes, selected)) throw Error(`Choose a probe: ${Object.keys(probes).join(', ')}`)
const root = resolve(import.meta.dirname, '../..')
writeRouteTemplates(root)
const work = join(root, 'research/nim-cli')
const compiler = await getToolchain({ cacheDir: join(work, 'toolchain') })
const paths = prepareDependencies(work, compiler)
const inputs = probes[selected].inputs(root)
const binary = join(work, `native/${selected}-probe${process.platform === 'win32' ? '.exe' : ''}`)
const run = spawnSync(compiler.nim, ['c','-d:release','--opt:size','--mm:orc', ...(process.argv.includes('--debug') ? ['--stackTrace:on', '--lineTrace:on'] : []), ...paths.map(path => `--path:${path}`),
 `--nimcache:${join(work, `${selected}-cache`)}`, `-o:${binary}`,
 join(import.meta.dirname, probes[selected].entry)], { stdio: 'inherit' })
if (run.status !== 0) process.exit(run.status ?? 1)
if (probes[selected].inputs(root).sha256 !== inputs.sha256) throw Error('Probe sources changed during compilation')
writeFileSync(join(work, `native/${selected}-build.json`), JSON.stringify({ platform: process.platform, arch: process.arch,
 nativeInputs: inputs, nativeArtifact: artifactFingerprint(readFileSync(binary)) }))
