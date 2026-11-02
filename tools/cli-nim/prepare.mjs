import { getToolchain, nimVersion } from 'nim-toolchain'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { catalogPayload, commandSchema } from '../../packages/cli/src/agent/catalog.ts'
import { prepareDependencies } from './dependencies.mjs'
import { AGENT_COMMANDS } from '../../packages/cli/src/agent/commands.ts'
import { coreInputs, artifactFingerprint } from './native-inputs.mjs'
import { writeRouteTemplates } from './route-templates.mjs'
const root = resolve(import.meta.dirname, '../..')
const cache = resolve(root, 'research/nim-cli')
mkdirSync(cache, { recursive: true })
writeRouteTemplates(root)
if (nimVersion !== '2.2.12') throw Error('Compiler pin mismatch')
const toolchain = await getToolchain({ cacheDir: resolve(cache, 'toolchain') })
writeFileSync(resolve(cache, 'compiler.json'), JSON.stringify({ nim: toolchain.nim, version: nimVersion }))
function run(cmd, args) { const r = spawnSync(cmd,args,{stdio:'inherit'}); if(r.status !== 0) throw Error(cmd+' failed') }
export const dependencyPaths = prepareDependencies(cache, toolchain)
writeFileSync(resolve(import.meta.dirname,'catalog.json'), JSON.stringify({catalog:catalogPayload(), schemas:Object.fromEntries(AGENT_COMMANDS.map(c=>[c.name,commandSchema(c)])),help:AGENT_COMMANDS.map(c=>`${c.name}: ${c.summary}`).join('\n')+'\n'}))
const inputs = coreInputs(root)
run(toolchain.nim, ['c','-d:release','--opt:size','--mm:orc',...(process.platform === 'darwin' ? ['--passL:-dead_strip'] : process.platform === 'linux' ? ['--passL:-Wl,--gc-sections'] : []),...dependencyPaths.map(path=>`--path:${path}`),`--nimcache:${cache}/nimcache`,`-o:${cache}/core${process.platform === 'win32' ? '.exe' : ''}`,resolve(import.meta.dirname,'core.nim')])
if (process.platform !== 'win32') run('strip',[resolve(cache,'core')])
if (coreInputs(root).sha256 !== inputs.sha256) throw Error('Core sources changed during compilation')
writeFileSync(resolve(cache, 'core-build.json'), JSON.stringify({ platform: process.platform, arch: process.arch, nativeInputs: inputs,
 nativeArtifact: artifactFingerprint(readFileSync(resolve(cache, `core${process.platform === 'win32' ? '.exe' : ''}`))) }))
