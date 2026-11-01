// Build native production entry with real TypeScript command metadata.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { getToolchain } from 'nim-toolchain'
import { AGENT_COMMANDS } from '../../packages/cli/src/agent/commands.ts'
const root = resolve(import.meta.dirname, '../..')
const work = resolve(root, 'research/nim-cli')
const version = process.env.XPLAT_NIM_VERSION ?? JSON.parse(readFileSync(resolve(root, 'packages/cli/package.json'))).version + '-nim.0'
if (!/^\d+\.\d+\.\d+-nim\.[0-9]+$/.test(version)) throw Error('Require an exact x.y.z-nim.N prerelease')
// Reuse the checksum-verified compiler/YAML preparation and source pins.
await import('./prepare.mjs')
const compiler = await getToolchain({cacheDir:resolve(work,'toolchain')})
const cli = resolve(root, 'packages/cli/src/cli.ts')
function reference(args) {
 const r=spawnSync(process.execPath,[cli,...args],{encoding:'utf8',cwd:root})
 if(r.status!==0) throw Error(r.stderr)
 return r.stdout
}
const catalog=JSON.parse(reference(['catalog','--json']))
// Version denotes this native build; execution coverage must never be inferred
// from the reference schemas' implemented status.
catalog.data.cli.version=version
for(const c of catalog.data.commands) c.status=c.command==='catalog'?'implemented':'pending'
for(const c of catalog.data.orchestration) c.status=c.name==='clean'?'implemented':'pending'
const commands={}
for(const c of AGENT_COMMANDS) {
 const schema=JSON.parse(reference([...c.path,'--schema']))
 schema.data.status=c.name==='catalog'?'implemented':'pending'
 commands[c.name]={schema,help:reference([...c.path,'--help'])}
}
writeFileSync(resolve(root,'packages/cli/nim/metadata.json'),JSON.stringify({version,commands,catalog,catalogHuman:""}))
mkdirSync(resolve(work,'native'),{recursive:true})
const binary=resolve(work,process.platform==='win32'?'native/xplat.exe':'native/xplat')
const flags=['c','-d:release','--opt:size','--mm:orc',...(process.platform === 'darwin' ? ['--passL:-dead_strip'] : process.platform === 'linux' ? ['--passL:-Wl,--gc-sections'] : []),`--path:${work}/yaml`,`--nimcache:${work}/native-cache`,`-o:${binary}`,resolve(root,'packages/cli/nim/main.nim')]
for(const [cmd,args] of [[compiler.nim,flags],...(process.platform==='win32'?[]:[['strip',[binary]]])]) {
 const r=spawnSync(cmd,args,{stdio:'inherit'});if(r.status!==0)throw Error('Native build failed')
}
writeFileSync(resolve(work,'native/build.json'),JSON.stringify({version,platform:process.platform,arch:process.arch,flags}))
