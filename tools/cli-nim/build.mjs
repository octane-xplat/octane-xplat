// Build native production entry with real TypeScript command metadata.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { getToolchain } from 'nim-toolchain'
import { AGENT_COMMANDS } from '../../packages/cli/src/agent/commands.ts'
import { CAPABILITY_IDS } from '../../packages/cli/src/mcp/contracts/capabilities.ts'
import { PRODUCT_BOUNDARIES } from '../../packages/cli/src/mcp/contracts/boundaries.ts'
import { nativeInputs, artifactFingerprint, httpProbeInputs, processProbeInputs } from './native-inputs.mjs'
import { routeCommandDescriptor, buildCommandDescriptor } from './route-templates.mjs'
const root = resolve(import.meta.dirname, '../..')
const work = resolve(root, 'research/nim-cli')
const version = process.env.XPLAT_NIM_VERSION ?? JSON.parse(readFileSync(resolve(root, 'packages/cli/package.json'))).version + '-nim.0'
if (!/^\d+\.\d+\.\d+-nim\.[0-9]+$/.test(version)) {throw Error('Require an exact x.y.z-nim.N prerelease')}
// Reuse the checksum-verified compiler/YAML preparation and source pins.
const { dependencyPaths } = await import('./prepare.mjs')
const compiler = await getToolchain({cacheDir:resolve(work,'toolchain')})
const cli = resolve(root, 'packages/cli/src/cli.ts')
function reference(args) {
 const r=spawnSync(process.execPath,[cli,...args],{encoding:'utf8',cwd:root})
 if(r.status!==0) {throw Error(r.stderr)}
 return r.stdout
}
const catalog=JSON.parse(reference(['catalog','--json']))
delete catalog.requestId
// Version denotes this native build; execution coverage must never be inferred
// from the reference schemas' implemented status.
catalog.data.cli.version=version
const nativeCommands=['catalog','status','capabilities','permissions','app select','code search','code read','guidance','docs read','session list','session status','session end','job status','job cancel','runtime build']
for(const c of catalog.data.commands) {c.status=nativeCommands.includes(c.command)?'implemented':'pending'}
for(const c of catalog.data.orchestration) {c.status=['clean','typecheck','routes','build'].includes(c.name)?'implemented':'pending'}
const commands={}
for(const c of AGENT_COMMANDS) {
 const schema=JSON.parse(reference([...c.path,'--schema']))
 delete schema.requestId
 schema.data.status=nativeCommands.includes(c.name)?'implemented':'pending'
 commands[c.name]={descriptor:c,schema,help:reference([...c.path,'--help'])}
}
writeFileSync(resolve(root,'packages/cli/nim/metadata.json'),JSON.stringify({version,commands,catalog,capabilityIds:CAPABILITY_IDS,boundaries:PRODUCT_BOUNDARIES,catalogHuman:"",typecheckHelp:reference(['typecheck','--help']),
 buildHelp:reference(['build','--help']),buildDescriptor:buildCommandDescriptor(readFileSync(resolve(root,'packages/cli/src/commands/build.ts'),'utf8')),
 routesHelp:reference(['routes','--help']),routeDescriptor:routeCommandDescriptor(readFileSync(resolve(root,'packages/cli/src/commands/routes.ts'),'utf8'))}))
mkdirSync(resolve(work,'native'),{recursive:true})
const binary=resolve(work,process.platform==='win32'?'native/xplat.exe':'native/xplat')
const flags=['c','-d:release','--opt:size','--mm:orc',...(process.platform === 'darwin' ? ['--passL:-dead_strip'] : process.platform === 'linux' ? ['--passL:-Wl,--gc-sections'] : []),...dependencyPaths.map(path=>`--path:${path}`),`--nimcache:${work}/native-cache`,`-o:${binary}`,resolve(root,'packages/cli/nim/main.nim')]
const inputs=nativeInputs(root)
for(const [cmd,args] of [[compiler.nim,flags],...(process.platform==='win32'?[]:[['strip',[binary]]])]) {
 const r=spawnSync(cmd,args,{stdio:'inherit'});if(r.status!==0){throw Error('Native build failed')}
}
if(nativeInputs(root).sha256!==inputs.sha256){throw Error('Native sources changed during compilation; rebuild before qualifying this artifact')}
writeFileSync(resolve(work,'native/build.json'),JSON.stringify({version,platform:process.platform,arch:process.arch,flags,stripped:process.platform!=='win32',nativeInputs:inputs,nativeArtifact:artifactFingerprint(readFileSync(binary))}))

writeFileSync(resolve(work,'native/NOTICE.txt'), readFileSync(resolve(work,'NOTICE.txt')))

const parser=resolve(work,process.platform==='win32'?'native/args-probe.exe':'native/args-probe')
const parserBuild=spawnSync(compiler.nim,['c','-d:release',`--nimcache:${work}/args-cache`,`-o:${parser}`,resolve(import.meta.dirname,'args_probe.nim')],{stdio:'inherit'})
if(parserBuild.status!==0){throw Error('Argument probe build failed')}

const packageProbe=resolve(work,process.platform==='win32'?'native/package-probe.exe':'native/package-probe')
const packageBuild=spawnSync(compiler.nim,['c','-d:release','--opt:size',...dependencyPaths.map(path=>`--path:${path}`),`--nimcache:${work}/package-cache`,`-o:${packageProbe}`,resolve(import.meta.dirname,'package_probe.nim')],{stdio:'inherit'})
if(packageBuild.status!==0){throw Error('Package-manager probe build failed')}

const identityProbe=resolve(work,process.platform==='win32'?'native/identity-probe.exe':'native/identity-probe')
const identityBuild=spawnSync(compiler.nim,['c','-d:release','--opt:size',...dependencyPaths.map(path=>`--path:${path}`),`--nimcache:${work}/identity-cache`,`-o:${identityProbe}`,resolve(import.meta.dirname,'identity_probe.nim')],{stdio:'inherit'})
if(identityBuild.status!==0){throw Error('Identity/corpus probe build failed')}

const codeProbe=resolve(work,process.platform==='win32'?'native/code-probe.exe':'native/code-probe')
const codeBuild=spawnSync(compiler.nim,['c','-d:release','--opt:size',...dependencyPaths.map(path=>`--path:${path}`),`--nimcache:${work}/code-cache`,`-o:${codeProbe}`,resolve(import.meta.dirname,'code_probe.nim')],{stdio:'inherit'})
if(codeBuild.status!==0){throw Error('Code provider/index probe build failed')}

const docsProbe=resolve(work,process.platform==='win32'?'native/docs-probe.exe':'native/docs-probe')
const docsBuild=spawnSync(compiler.nim,['c','-d:release','--opt:size',...dependencyPaths.map(path=>`--path:${path}`),`--nimcache:${work}/docs-cache`,`-o:${docsProbe}`,resolve(import.meta.dirname,'docs_probe.nim')],{stdio:'inherit'})
if(docsBuild.status!==0){throw Error('Documentation retrieval probe build failed')}

const sqliteProbe=resolve(work,process.platform==='win32'?'native/sqlite-probe.exe':'native/sqlite-probe')
const sqliteBuild=spawnSync(compiler.nim,['c','-d:release','--opt:size',...dependencyPaths.map(path=>`--path:${path}`),`--nimcache:${work}/sqlite-cache`,`-o:${sqliteProbe}`,resolve(import.meta.dirname,'sqlite_probe.nim')],{stdio:'inherit'})
if(sqliteBuild.status!==0){throw Error('SQLite boundary probe build failed')}

const indexProbe=resolve(work,process.platform==='win32'?'native/docs-index-probe.exe':'native/docs-index-probe')
const indexBuild=spawnSync(compiler.nim,['c','-d:release','--opt:size',...dependencyPaths.map(path=>`--path:${path}`),`--nimcache:${work}/docs-index-cache`,`-o:${indexProbe}`,resolve(import.meta.dirname,'docs_index_probe.nim')],{stdio:'inherit'})
if(indexBuild.status!==0){throw Error('Documentation index probe build failed')}

const tokenizerProbe=resolve(work,process.platform==='win32'?'native/tokenizer-probe.exe':'native/tokenizer-probe')
const tokenizerBuild=spawnSync(compiler.nim,['c','-d:release','--opt:size',...dependencyPaths.map(path=>`--path:${path}`),`--nimcache:${work}/tokenizer-cache`,`-o:${tokenizerProbe}`,resolve(import.meta.dirname,'tokenizer_probe.nim')],{stdio:'inherit'})
if(tokenizerBuild.status!==0){throw Error('Tokenizer probe build failed')}

const httpProbe=resolve(work,process.platform==='win32'?'native/http-probe.exe':'native/http-probe')
const httpInputs=httpProbeInputs(root)
const httpBuild=spawnSync(compiler.nim,['c','-d:release','--opt:size','--mm:orc',...dependencyPaths.map(path=>`--path:${path}`),`--nimcache:${work}/http-cache`,`-o:${httpProbe}`,resolve(import.meta.dirname,'http_probe.nim')],{stdio:'inherit'})
if(httpBuild.status!==0){throw Error('HTTP probe build failed')}
if(httpProbeInputs(root).sha256!==httpInputs.sha256){throw Error('HTTP probe sources changed during compilation')}
writeFileSync(resolve(work,'native/http-build.json'),JSON.stringify({platform:process.platform,arch:process.arch,nativeInputs:httpInputs,nativeArtifact:artifactFingerprint(readFileSync(httpProbe))}))

const processProbe=resolve(work,process.platform==='win32'?'native/process-probe.exe':'native/process-probe')
const processInputs=processProbeInputs(root)
const processBuild=spawnSync(compiler.nim,['c','-d:release','--opt:size','--mm:orc',...dependencyPaths.map(path=>`--path:${path}`),`--nimcache:${work}/process-cache`,`-o:${processProbe}`,resolve(import.meta.dirname,'process_probe.nim')],{stdio:'inherit'})
if(processBuild.status!==0){throw Error('Managed process probe build failed')}
if(processProbeInputs(root).sha256!==processInputs.sha256){throw Error('Managed process probe sources changed during compilation')}
writeFileSync(resolve(work,'native/process-build.json'),JSON.stringify({platform:process.platform,arch:process.arch,nativeInputs:processInputs,nativeArtifact:artifactFingerprint(readFileSync(processProbe))}))
