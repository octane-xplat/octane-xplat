import { getToolchain, nimVersion } from 'nim-toolchain'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { catalogPayload, commandSchema } from '../../packages/cli/src/agent/catalog.ts'
import { AGENT_COMMANDS } from '../../packages/cli/src/agent/commands.ts'
const root = resolve(import.meta.dirname, '../..')
const cache = resolve(root, 'research/nim-cli')
mkdirSync(cache, { recursive: true })
if (nimVersion !== '2.2.12') throw Error('Compiler pin mismatch')
const toolchain = await getToolchain({ cacheDir: resolve(cache, 'toolchain') })
writeFileSync(resolve(cache, 'compiler.json'), JSON.stringify({ nim: toolchain.nim, version: nimVersion }))
const pin = JSON.parse(readFileSync(new URL('./nim-dependencies.json', import.meta.url)))
const revision = pin.yaml.revision
const yaml = resolve(cache, 'yaml')
function run(cmd, args) { const r = spawnSync(cmd,args,{stdio:'inherit'}); if(r.status !== 0) throw Error(cmd+' failed') }
if (spawnSync('git', ['-C',yaml,'rev-parse','HEAD'],{encoding:'utf8'}).stdout?.trim() !== revision) {
  run('git',['clone','https://github.com/flyx/NimYAML.git',yaml]); run('git',['-C',yaml,'checkout',revision])
}
writeFileSync(resolve(import.meta.dirname,'catalog.json'), JSON.stringify({catalog:catalogPayload(), schemas:Object.fromEntries(AGENT_COMMANDS.map(c=>[c.name,commandSchema(c)])),help:AGENT_COMMANDS.map(c=>`${c.name}: ${c.summary}`).join('\n')+'\n'}))
run(toolchain.nim, ['c','-d:release','--opt:size','--mm:orc',...(process.platform === 'darwin' ? ['--passL:-dead_strip'] : process.platform === 'linux' ? ['--passL:-Wl,--gc-sections'] : []),`--path:${yaml}`,`--nimcache:${cache}/nimcache`,`-o:${cache}/core${process.platform === 'win32' ? '.exe' : ''}`,resolve(import.meta.dirname,'core.nim')])
if (process.platform !== 'win32') run('strip',[resolve(cache,'core')])
