import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { builtinModules } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { inspectCompatibility } from '../../packages/cli/src/compatibility-check.ts'
import { compatibility, managedSpecifier, managedPackage } from '../../packages/create/compatibility.ts'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'
const root=resolve(import.meta.dirname,'../..'), binary=join(root,'research/nim-cli/native/env-probe')
assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/env-build.json'))),readFileSync(binary),envProbeInputs)
const scratch=scratchRun(root,'native-compatibility'), tools={node:'v26.12.0',bun:'1.4.4',pnpm:'11.24.0'}
let sequence=0, compared=0
const core='@octane-xplat/nativescript-mason-core', full='@octane-xplat/nativescript-masonkit'
after(()=>{rmSync(scratch,{recursive:true,force:true});console.log(`${compared} metadata-only compatibility fixtures matched Node`)})
function write(dir,path,data){const file=join(dir,path);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,typeof data==='string'?data:JSON.stringify(data));return file}
function project(pkg={}){const dir=join(scratch,String(++sequence));write(dir,'package.json',{private:true,packageManager:'bun@1.4.4',...pkg});return dir}
function install(dir,name,version=managedSpecifier(name),extra={}){
 const path=join(dir,'node_modules',name)
 write(path,'package.json',{name,version,exports:'./index.js',...extra})
 write(path,'index.js','throw Error("DEPENDENCY_CODE_MUST_NOT_EXECUTE");')
 return path
}
function native(dir,observed=tools,extra={},environment={}){
 const result=spawnSync(binary,[],{input:JSON.stringify({operation:'compatibility',dir,pins:compatibility,tools:observed,builtins:builtinModules,...extra})+'\n',encoding:'utf8',timeout:10000,env:{...process.env,NODE_OPTIONS:'',NODE_PATH:'',...environment}})
 assert.equal(result.status,0,result.stderr)
 return JSON.parse(result.stdout)
}
function compare(dir,observed=tools){
 const before=readFileSync(join(dir,'package.json'))
 const expected=inspectCompatibility(dir,observed), actual=native(dir,observed)
 assert.equal(actual.ok,true,actual.message)
 assert.deepEqual(actual.value,expected)
 assert.deepEqual(readFileSync(join(dir,'package.json')),before)
 assert.ok(!existsSync(join(dir,'pnpm-workspace.yaml'))||readFileSync(join(dir,'pnpm-workspace.yaml')).length)
 compared++
 return actual.value
}
test('host tool versions, package-manager declarations and ignored root consumer peers match',()=>{
 for(const observed of [tools,{...tools,node:'v22.17.0'},{...tools,node:'unavailable'},{...tools,bun:'1.4.3'},{...tools,bun:'1.4.5'},{...tools,node:'v22.22.2-preview.0'}]){compare(project(),observed)}
 compare(project({packageManager:'bun@1.4.4+sha256.test'}))
 compare(project({packageManager:'pnpm@11.24.0'}))
 compare(project({packageManager:'pnpm@11.24.0'}),{...tools,pnpm:'11.24.1'})
 compare(project({peerDependencies:{octane:'*','@octane-xplat/ui':'*'}}))
})
test('managed pins, missing compiler peers and installed metadata are independent',()=>{
 for(const declared of ['0.1.0',managedSpecifier('octane')]){
  const dir=project({dependencies:{octane:declared,'@tsrx/oxc':managedSpecifier('@tsrx/oxc')}})
  install(dir,'octane','0.1.0');install(dir,'@tsrx/oxc');compare(dir)
 }
 compare(project({dependencies:{octane:managedSpecifier('octane')}}))
 const dir=project({dependencies:{alias:'1.0.0'}});install(dir,'alias','0.1.0',{name:'octane'});compare(dir)
})
test('optional root packages and optional dependency/peer edges do not create missing-package errors',()=>{
 const dir=project({dependencies:{vendor:'1.0.0'},optionalDependencies:{'@nativescript/ios':managedSpecifier('@nativescript/ios')}})
 install(dir,'vendor','1.0.0',{dependencies:{octane:'*'},optionalDependencies:{'@tsrx/oxc':'*'},peerDependencies:{'@octane-xplat/ui':'*'},peerDependenciesMeta:{'@octane-xplat/ui':{optional:true}}})
 compare(dir)
 const required=project({dependencies:{vendor:'1.0.0'}});install(required,'vendor','1.0.0',{peerDependencies:{octane:'*'}});compare(required)
})
test('reachable singleton graph detects physical copies, deduplicates symlinks and terminates cycles',()=>{
 for(const version of [managedSpecifier('octane'),'0.1.0']){
  const dir=project({dependencies:{octane:managedSpecifier('octane'),'@tsrx/oxc':managedSpecifier('@tsrx/oxc'),vendor:'1.0.0'}})
  install(dir,'octane');install(dir,'@tsrx/oxc');const vendor=install(dir,'vendor','1.0.0',{dependencies:{octane:'*'}});install(vendor,'octane',version);compare(dir)
 }
 const dir=project({dependencies:{octane:managedSpecifier('octane'),vendor:'1.0.0'}})
 const runtime=install(dir,'octane'),vendor=install(dir,'vendor','1.0.0',{dependencies:{octane:'*',cycle:'*'}})
 mkdirSync(join(vendor,'node_modules'),{recursive:true});symlinkSync(runtime,join(vendor,'node_modules/octane'),'dir');symlinkSync(vendor,join(vendor,'node_modules/cycle'),'dir');compare(dir)
 install(join(dir,'unrelated-app'),'octane','0.1.0');compare(dir)
})
test('local root overrides skip pin/version checks while retaining singleton identity checks',()=>{
 for(const prefix of ['workspace:','link:','file:','portal:']){
  const dir=project({dependencies:{octane:prefix+'../private'}});install(dir,'octane','0.1.0');compare(dir)
 }
 const dir=project({dependencies:{vendor:'1.0.0'}});const vendor=install(dir,'vendor','1.0.0',{dependencies:{octane:'file:../private'}});install(vendor,'octane','0.1.0');compare(dir)
})
test('Windows profile and Mason engine identities retain native-layout safety constraints',()=>{
 for(const name of [core,full,'@triniwiz/nativescript-masonkit']){
  const dir=project({dependencies:{'@nativescript-community/octane':managedSpecifier('@nativescript-community/octane'),[name]:name===core?managedSpecifier(core):'0.1.0'}})
  install(dir,'@nativescript-community/octane');install(dir,name,'0.1.0');compare(dir)
 }
 const win=project({xplat:{targets:{windows:{}}},dependencies:{'@nativescript/windows':managedSpecifier('@nativescript/windows','windows')}});install(win,'@nativescript/windows',managedPackage('@nativescript/windows','windows').version);compare(win)
 const mixed=project({dependencies:{'@nativescript/windows':'1','@nativescript/ios':'1'}})
 assert.throws(()=>inspectCompatibility(mixed,tools),/separate workspace/)
 assert.match(native(mixed).message,/separate workspace/)
})
test('Bun and pnpm catalogs resolve at the declared workspace owner',()=>{
 for(const manager of ['bun','pnpm']){
  const pkg={packageManager:manager+'@'+tools[manager],workspaces:{packages:['apps/*'],catalog:{octane:managedSpecifier('octane')},catalogs:{selected:{'@tsrx/oxc':managedSpecifier('@tsrx/oxc')}}}}
  const dir=project(pkg),app=join(dir,'apps/app')
  write(app,'package.json',{dependencies:{octane:'catalog:','@tsrx/oxc':'catalog:selected'}})
  if(manager==='pnpm'){write(dir,'pnpm-workspace.yaml',`packages:\n  - apps/*\ncatalog:\n  octane: ${managedSpecifier('octane')}\ncatalogs:\n  selected:\n    '@tsrx/oxc': ${managedSpecifier('@tsrx/oxc')}\n`)}
  install(dir,'octane');install(dir,'@tsrx/oxc');compare(app)
 }
})
test('private nested non-singleton tool versions are implementation details; required managed transitive absence still fails',()=>{
 const dir=project({dependencies:{vendor:'1.0.0'}}), vendor=install(dir,'vendor','1.0.0',{dependencies:{typescript:'*'}})
 install(vendor,'typescript','0.1.0');compare(dir)
 rmSync(join(vendor,'node_modules/typescript'),{recursive:true});compare(dir)
})
test('bounded traversal and malformed metadata fail explicitly without executing dependency code',()=>{
 const dir=project({dependencies:{vendor:'1.0.0'}});install(dir,'vendor','1.0.0',{dependencies:{octane:'*'}})
 assert.match(native(dir,tools,{limit:1}).message,/package bound/)
 write(dir,'node_modules/vendor/package.json','{"name":')
 assert.throws(()=>inspectCompatibility(dir,tools));assert.equal(native(dir).ok,false)
})

test('builtin names cannot introduce a fake package graph; native metadata inspection needs no Node on PATH',()=>{
 const dir=project({dependencies:{fs:'0.0.1','node:made-up':'1.0.0'}})
 install(dir,'fs','0.0.1',{dependencies:{octane:'*'}})
 const expected=compare(dir)
 const result=native(dir,tools,{}, {PATH:''})
 assert.equal(result.ok,true,result.message);assert.deepEqual(result.value,expected)
})

test('the real installed CLI workspace graph matches Node without dependency execution or metadata writes',()=>{
 compare(join(root,'packages/cli'))
})
