// Focused native iteration after the initial Turbo build prepared metadata.
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { getToolchain } from 'nim-toolchain'
import { prepareDependencies } from './dependencies.mjs'
import { readFileSync, writeFileSync } from 'node:fs'
import { httpProbeInputs, artifactFingerprint } from './native-inputs.mjs'
const probes = { http: 'http_probe.nim' }
const selected = process.argv[2]
if (!Object.hasOwn(probes, selected)) throw Error(`Choose a probe: ${Object.keys(probes).join(', ')}`)
const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/nim-cli')
const compiler = await getToolchain({ cacheDir: join(work, 'toolchain') })
const paths = prepareDependencies(work, compiler)
const inputs = httpProbeInputs(root)
const binary = join(work, `native/${selected}-probe${process.platform === 'win32' ? '.exe' : ''}`)
const run = spawnSync(compiler.nim, ['c','-d:release','--opt:size','--mm:orc', ...paths.map(path => `--path:${path}`),
 `--nimcache:${join(work, `${selected}-cache`)}`, `-o:${binary}`,
 join(import.meta.dirname, probes[selected])], { stdio: 'inherit' })
if (run.status !== 0) process.exit(run.status ?? 1)
if (httpProbeInputs(root).sha256 !== inputs.sha256) throw Error('HTTP probe sources changed during compilation')
writeFileSync(join(work, 'native/http-build.json'), JSON.stringify({ platform: process.platform, arch: process.arch,
 nativeInputs: inputs, nativeArtifact: artifactFingerprint(readFileSync(binary)) }))
