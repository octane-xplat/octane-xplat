import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, symlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
const root = resolve(import.meta.dirname, '../..')
const binary = resolve(root,`research/nim-cli/native/xplat${process.platform==='win32'?'.exe':''}`)
const reference = resolve(root,'packages/cli/src/cli.ts')
const env = { ...process.env, XPLAT_PERMISSIONS:'', XPLAT_AGENT_CLIENT:'' }
const fixtures = () => mkdtempSync(join(tmpdir(),'xplat-nim-workspace-'))
function app(at, name, targets = {}) {
 mkdirSync(at,{recursive:true})
 writeFileSync(join(at,'package.json'),JSON.stringify({name,dependencies:{'@octane-xplat/ui':'workspace:*'},xplat:{targets}}))
 writeFileSync(join(at,'vite.config.ts'),'export default {}\n')
}
function invoke(native,args,cwd=root,extra={}) {
 return spawnSync(native?binary:process.execPath,native?args:[reference,...args],{cwd,env:{...env,...extra,...(native?{PATH:''}:{})},encoding:'utf8',timeout:20000})
}
function normalize(value) {
 if(Array.isArray(value))return value.map(normalize)
 if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>key!=='requestId').map(([key,val])=>{
  if(key==='selectedAt'||key==='grantedAt'){
   assert.match(val,/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
   assert.ok(Math.abs(Date.parse(val)-Date.now())<60000)
   return [key,'<current-utc>']
  }
  return [key,normalize(val)]
 }))
 return value
}
function parity(args,cwd=root,extra={}) {
 const expected=invoke(false,args,cwd,extra),actual=invoke(true,args,cwd,extra)
 assert.equal(actual.status,expected.status,`${args.join(' ')}: ${actual.stderr}`)
 assert.equal(actual.stderr,expected.stderr)
 if(args.includes('--json'))assert.deepEqual(normalize(JSON.parse(actual.stdout)),normalize(JSON.parse(expected.stdout)),args.join(' '))
 else assert.equal(actual.stdout,expected.stdout,args.join(' '))
 return args.includes('--json')?JSON.parse(actual.stdout):actual.stdout
}
test('task permissions preserve scope states, overrides, human output and explicit approval boundaries',()=>{
 const empty=fixtures()
 writeFileSync(join(empty,'package.json'),'{}')
 for(const extra of [{},{XPLAT_PERMISSIONS:'visual-capture,evidence-retain'},{XPLAT_PERMISSIONS:' workspace ,runtime-actions,external-effects,unknown,visual-capture,visual-capture'},{XPLAT_PERMISSIONS:'\u00a0visual-capture\ufeff'}]){
  parity(['permissions','--project',empty,'--json'],root,extra)
  parity(['permissions','--project',empty],root,extra)
  for(const scope of ['workspace','visual-capture','evidence-retain','external-effects']){
   parity(['permissions','--scope',scope,'--project',empty,'--json'],root,extra)
   parity(['permissions','--scope',scope,'--project',empty],root,extra)
  }
 }
 const visual=JSON.parse(invoke(true,['permissions','--scope','visual-capture','--project',empty,'--json']).stdout)
 assert.equal(visual.data.check.granted,false)
})
test('app binding writes client-scoped preferences and preserves reference selection/envelope behavior',()=>{
 const workspace=fixtures()
 writeFileSync(join(workspace,'package.json'),JSON.stringify({name:'workspace',workspaces:['apps/*']}))
 app(join(workspace,'apps/alpha'),'alpha')
 app(join(workspace,'apps/beta'),'beta',{macos:{runtime:'appkit-node-api'}})
 for(const selector of ['alpha','apps/beta','missing']){
  const result=parity(['app','select',selector,'--project',workspace,'--client','agent_one','--json'])
  if(result.ok){
   assert.equal(result.context.selection.reason,'explicit')
   const saved=JSON.parse(readFileSync(result.data.preference.path))
   assert.equal(saved.client,'agent_one');assert.equal(saved.appId,result.data.bound.id)
   assert.ok(Date.parse(saved.selectedAt))
  }
 }
 parity(['permissions','--project',workspace,'--client','agent_one','--json'])
 parity(['permissions','--project',workspace,'--client','another_agent','--json'])
 parity(['permissions','--project',workspace,'--client','agent_one','--app','alpha','--json'])
 parity(['app','select','alpha','--project',workspace,'--client','human'])
 // Names can collide. The exact path is required; never silently pick one.
 app(join(workspace,'examples/alpha'),'alpha')
 const ambiguous=parity(['app','select','alpha','--project',workspace,'--json'])
 assert.equal(ambiguous.error.code,'ambiguous_selection')
 assert.equal(ambiguous.error.context.candidates.length,2)
 // Null names take the same fallback as `manifest.name ?? relativeBasename`.
 app(join(workspace,'apps/unnamed'),null,null)
 parity(['app','select','apps/unnamed','--project',workspace,'--json'])
})
test('explicit apps beat saved selection and sole-app discovery does not silently bind the envelope',()=>{
 const workspace=fixtures()
 app(workspace,'one')
 const sole=parity(['permissions','--project',workspace,'--json'])
 assert.equal(sole.context.projectId,null)
 parity(['permissions','--project',workspace,'--app','one','--json'])
 parity(['app','select','one','--project',workspace,'--json'])
 const preferred=parity(['permissions','--project',workspace,'--json'])
 assert.equal(preferred.context.selection.reason,'preference')
 const missing=parity(['permissions','--project',workspace,'--app','missing','--json'])
 assert.equal(missing.context.projectId,null)
 // Invalid preference JSON and invalid client syntax are never read as bindings.
 writeFileSync(join(workspace,'node_modules/.cache/xplat/agent/default.json'),'{')
 parity(['permissions','--project',workspace,'--json'])
 parity(['permissions','--project',workspace,'--client','../outside','--json'])
})
test('native app preference writes reject client path traversal',()=>{
 const workspace=fixtures();app(workspace,'one')
 for(const client of ['../outside','a/b','', 'a'.repeat(65)]){
  const result=invoke(true,['app','select','one','--project',workspace,'--client',client,'--json'])
  assert.equal(result.status,2)
  assert.equal(JSON.parse(result.stdout).error.code,'invalid_selection')
 }
 assert.equal(existsSync(join(workspace,'node_modules/.cache/xplat/outside.json')),false)
})

test('selection uses normalized lexical paths, Unicode names and bounded directory discovery',()=>{
 const workspace=fixtures()
 writeFileSync(join(workspace,'package.json'),JSON.stringify({name:'octane-xplat'}))
 app(join(workspace,'apps/café 😀'),'café 😀')
 app(join(workspace,'packages/unnamed'),null)
 for(const skipped of ['research/hidden','node_modules/hidden','.private/hidden','dist/hidden']) app(join(workspace,skipped),'hidden')
 if(process.platform!=='win32')symlinkSync(workspace,join(workspace,'apps/loop'))
 const missing=parity(['app','select','missing','--project',workspace,'--json'])
 assert.equal(missing.error.context.candidates.length,2)
 parity(['app','select','café 😀','--project',join(workspace,'apps','..'),'--client','unicode_agent','--json'])
 parity(['app','select','packages/unnamed','--project',workspace,'--client','unicode_agent','--json'])
})
