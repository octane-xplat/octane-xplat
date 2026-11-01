import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, globSync, symlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import * as manager from '../../packages/cli/src/package-manager.ts'
import { installedPackageRoot } from '../../packages/cli/src/package-root.ts'
import { resolveFrameworkBinding } from '../../packages/cli/src/mcp/discovery.ts'
import { createRequire } from 'node:module'
const require=createRequire(new URL('../../packages/cli/package.json',import.meta.url))
const jsonc=require('jsonc-parser')
const root=resolve(import.meta.dirname,'../..')
const binary=resolve(root,`research/nim-cli/native/package-probe${process.platform==='win32'?'.exe':''}`)
function fixture(){return mkdtempSync(join(tmpdir(),'xplat-native-manager-'))}
function json(path,value){mkdirSync(resolve(path,'..'),{recursive:true});writeFileSync(path,JSON.stringify(value))}
function expected(r){
 const m=r.manager??undefined
 try{
  let value
  switch(r.operation){
   case 'workspace':value=manager.readProjectWorkspace(r.dir,m);break
   case 'members':value=manager.workspaceMembers(r.dir,m);break
   case 'root':value=manager.packageManagerRoot(r.dir);break
   case 'manager':value=manager.packageManagerFor(r.dir,m);break
   case 'exec':value=manager.packageManagerExec(r.dir,r.args);break
   case 'bun':value=manager.readBunLock(r.dir);break
   case 'versions':value=manager.bunLockedVersions(r.dir);break
   case 'binding':value=resolveFrameworkBinding(r.root,r.dir);break
   case 'installed':value=installedPackageRoot(r.dir,r.name);break
   case 'glob':value=globSync(r.patterns,{cwd:r.dir,exclude:[...r.excluded,'**/node_modules','**/node_modules/**','**/.git','**/.git/**']}).map(p=>resolve(r.dir,p));break
   case 'jsonc':{const errors=[];value=jsonc.parse(r.source,errors,{allowTrailingComma:true});if(errors.length)throw Error('Invalid JSONC');break}
  }
  return JSON.parse(JSON.stringify({ok:true,value:value??null}))
 }catch(error){return{ok:false,message:error.message}}
}
function compare(requests){
 const exp=requests.map(expected)
 const process=spawnSync(binary,[],{encoding:'utf8',input:requests.map(r=>JSON.stringify(r)).join('\n')+'\n',maxBuffer:16*1024*1024,timeout:20000,env:{...globalThis.process.env,PATH:''}})
 assert.equal(process.status,0,process.stderr)
 const actual=process.stdout.trim().split('\n').map(JSON.parse)
 assert.equal(actual.length,requests.length)
 const mismatches=[]
 for(let i=0;i<requests.length;i++){
  const r=requests[i],e=exp[i],a=actual[i]
  if(r.operation==='glob'||r.operation==='members'){
   if(e.ok)e.value.sort();if(a.ok)a.value.sort()
  }
  try{
   assert.equal(a.ok,e.ok)
   if(e.ok)assert.deepEqual(a.value,e.value)
   else if(['manager','bun'].includes(r.operation))assert.equal(a.message,e.message)
  }catch{mismatches.push({request:r,expected:e,actual:a})}
 }
 if(mismatches.length)writeFileSync(resolve(root,`research/nim-cli/mismatches-${requests[0].operation}.json`),JSON.stringify(mismatches,null,2))
 console.log(`${requests.length} package-manager differential cases checked`)
 assert.deepEqual(mismatches.map(({request,expected,actual})=>({operation:request.operation,patterns:request.patterns,expected,actual})),[])
}
test('workspace patterns preserve Node glob sets, exclusions, braces, classes, hidden paths and links',()=>{
 const dir=fixture()
 for(const path of ['apps/alpha','apps/alpha-extra','apps/beta','apps/aaa','apps/a','apps/b','apps/c','apps/1','apps/2','apps/3','apps/01','apps/02','apps/03','apps/.hidden','apps/nested/deep','apps/nested/.hidden','apps/café 😀','apps/file.js','apps/file.txt','packages/lib','node_modules/ignored','.git/ignored'])json(join(dir,path,'package.json'),{})
 symlinkSync(join(dir,'packages/lib'),join(dir,'apps/link'),process.platform==='win32'?'junction':'dir')
 const patterns=[[],['apps/*'],['apps/**'],['**'],['{apps,packages}/*'],['{apps/{alpha,beta},packages/lib}'],['apps/{1..3}'],['apps/{03..01}'],['apps/{a..c}'],['apps/@(alpha|beta)'],['apps/!(alpha)'],['apps/!(alpha|beta)'],['apps/!(alpha)-extra'],['apps/file!(.js)'],['apps/+(a|b)'],['apps/?(alpha)'],['apps/*a'],['apps/[ab]*'],['apps/[!a]*'],['apps/.hidden'],['apps/.*'],['apps/[.]hidden'],['apps/**/.hidden'],['apps/**/package.json'],['apps/link/*'],['apps/{one}'],['apps/[unclosed'],['apps/**bar'],['apps/*','packages/*']]
 const requests=patterns.map(patterns=>({operation:'glob',dir,patterns,excluded:[]}))
 for(const excluded of [['apps/alpha'],['apps/alpha/**'],['apps/nested/**'],['apps/*'],['**/nested'],['**/package.json']])requests.push({operation:'glob',dir,patterns:['**'],excluded})
 compare(requests)
})
test('workspace roots use manager declarations and included membership, not nearest lockfiles',()=>{
 const requests=[]
 for(const config of [
  {pkg:{workspaces:['apps/*','!apps/excluded']},yaml:null},
  {pkg:{workspaces:{packages:['apps/**','!apps/excluded']},packageManager:'bun@1.4.4'},yaml:'packages: [packages/*]'},
  {pkg:{workspaces:['packages/*'],packageManager:'pnpm@11.0.0'},yaml:'packages: [apps/*, "!apps/excluded"]'},
  {pkg:{workspaces:{packages:['apps/{alpha,beta}'],catalog:{foo:'1'},catalogs:{base:{foo:'2'}}},overrides:{foo:'3'},patchedDependencies:{foo:'file.patch'}},yaml:null},
 ]){
  const dir=fixture();json(join(dir,'package.json'),config.pkg)
  if(config.yaml)writeFileSync(join(dir,'pnpm-workspace.yaml'),config.yaml)
  for(const app of ['alpha','beta','excluded']){
   const path=join(dir,'apps',app);json(join(path,'package.json'),{name:app})
   for(const operation of ['root','manager','exec'])requests.push({operation,dir:path,args:['vite','build']})
  }
  for(const operation of ['workspace','members'])for(const selected of [undefined,'bun','pnpm'])requests.push({operation,dir,manager:selected})
 }
 for(const pkg of [{},{packageManager:'npm@10.0.0'},{patchedDependencies:{}},{packageManager:'bun@1.4.4'},{packageManager:'pnpm@11.0.0'}]){
  const dir=fixture();json(join(dir,'package.json'),pkg);writeFileSync(join(dir,'bun.lock'),'{}');writeFileSync(join(dir,'pnpm-lock.yaml'),'{}')
  requests.push({operation:'manager',dir})
 }
 for(const source of ['', '# workspace comment\n', 'null\n', 'packages: []\n', 'packages: [apps/*]\n---\npackages: []\n']) {
  const dir=fixture();json(join(dir,'package.json'),{});writeFileSync(join(dir,'pnpm-workspace.yaml'),source)
  requests.push({operation:'workspace',dir},{operation:'members',dir})
 }
 for(const operation of ['members','root','versions'])requests.push({operation,dir:operation==='members'?root:join(root,'apps/web')})
 compare(requests)
})
test('Bun JSONC rejects malformed grammar while preserving comments and string contents',()=>{
 const sources=['{}','[]','true','null','0','{"a":1,}','[1,]','[,]', '{,}', '[1,,]', '{"a":,}', '/*x*/ {"url":"https://x//a","text":"/*no*/",}', '//x\n{"a":[1,2,],}', '{"number":01}', '{"number":1_0}', '{"number":.1}', '{"number":1.}', '{} extra', '/* unfinished', '{"a":"escaped \\" // string"}', '\ufeff{}']
 const requests=[]
 for(const source of sources){
  requests.push({operation:'jsonc',source})
  const dir=fixture();writeFileSync(join(dir,'bun.lock'),source);requests.push({operation:'bun',dir})
 }
 const binaryOnly=fixture();writeFileSync(join(binaryOnly,'bun.lockb'),'not a text lock');requests.push({operation:'bun',dir:binaryOnly})
 compare(requests)
})
test('binding preserves pnpm nullish fallback, malformed-lock policy and real installed-package precedence',()=>{
 const requests=[]
 for(const lock of [
  "importers:\n  '.':\n    dependencies:\n      '@octane-xplat/ui': {version: '0.20.0'}\n",
  "importers:\n  '.':\n    dependencies:\n      '@octane-xplat/ui': {version: null, specifier: '0.20.0'}\n",
  "importers:\n  '.':\n    dependencies:\n      '@octane-xplat/ui': {version: 0, specifier: '0.20.0'}\n",
  "importers:\n  '.':\n    dependencies:\n      '@octane-xplat/ui': {version: 1.0}\n",
  "package: &key '@octane-xplat/ui'\nimporters: {'.': {dependencies: {*key : {version: '0.20.0'}}}}\n",
  "importers: {'.': {dependencies: {&key '@octane-xplat/ui': {version: '0.20.0'}}}}\n",
  "importers: {}\n---\npackages: {}\n",
  "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: '0.20.0'}}}}\nimporters: {}\n",
  'importers: [\n',
 ]){
  for(const withInstall of [true,false]){
  const dir=fixture();json(join(dir,'package.json'),{dependencies:{'@octane-xplat/ui':'^0.20.0'}});writeFileSync(join(dir,'pnpm-lock.yaml'),lock)
  const installed=join(dir,'node_modules/@octane-xplat/ui');if(withInstall)json(join(installed,'package.json'),{name:'@octane-xplat/ui',version:'0.19.0'})
  requests.push({operation:'binding',root:dir,dir},{operation:'installed',dir,name:'@octane-xplat/ui'})
  }
 }
 // A nearer malformed installed manifest shadows a valid hoisted version.
 const dir=fixture(),app=join(dir,'apps/demo');json(join(dir,'package.json'),{workspaces:['apps/*']});json(join(app,'package.json'),{dependencies:{'@octane-xplat/ui':'^0.20.0'}})
 json(join(dir,'node_modules/@octane-xplat/ui/package.json'),{version:'0.21.0'});mkdirSync(join(app,'node_modules/@octane-xplat/ui'),{recursive:true});writeFileSync(join(app,'node_modules/@octane-xplat/ui/package.json'),'{')
 requests.push({operation:'binding',root:dir,dir:app},{operation:'installed',dir:app,name:'@octane-xplat/ui'})
 compare(requests)
})
test('valid YAML scalar alias keys retain the resolved package version',()=>{
 const requests=[]
 for(const lock of [
  "package: &key '@octane-xplat/ui'\nimporters: {'.': {dependencies: {*key : {version: '0.20.0'}}}}\n",
  "importers:\n  '.':\n    dependencies:\n      &key '@octane-xplat/ui': {version: '0.20.0'}\n",
 ]) {
  const dir=fixture();json(join(dir,'package.json'),{dependencies:{'@octane-xplat/ui':'^0.20.0'}});writeFileSync(join(dir,'pnpm-lock.yaml'),lock)
  assert.equal(resolveFrameworkBinding(dir,dir).packages[0].version,'0.20.0','Fixture must exercise a valid, resolved alias key')
  requests.push({operation:'binding',root:dir,dir})
 }
 compare(requests)
})
test('Bun importer ownership, optional dependencies, workspace identities and exact version prefixes match',()=>{
 const requests=[]
 for(const version of ['0.20.0(peer@1.0.0)','1garbage','1.2','1.2.3suffix','workspace:packages/ui']){
  const dir=fixture(),app=join(dir,'apps/demo');json(join(dir,'package.json'),{packageManager:'bun@1.4.4',workspaces:['apps/*']})
  json(join(app,'package.json'),{name:'demo',dependencies:{'@octane-xplat/ui':'^0.20.0'},optionalDependencies:{optional:'1'}})
  json(join(dir,'bun.lock'),{workspaces:{'apps/demo':{name:'owner'},'packages/ui':{version:'0.30.0'}},packages:{'owner/@octane-xplat/ui':[`@octane-xplat/ui@${version}`],'@octane-xplat/ui':['@octane-xplat/ui@0.10.0'],optional:['optional@1.2.3']}})
  for(const operation of ['versions','binding'])requests.push({operation,root:dir,dir:app})
 }
 compare(requests)
})
