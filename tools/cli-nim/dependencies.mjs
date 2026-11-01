import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
export function prepareDependencies(cache, toolchain) {
 const pin = JSON.parse(readFileSync(new URL('./nim-dependencies.json',import.meta.url)))
 if(toolchain.version!==pin.compiler.nim)throw Error(`Compiler pin mismatch: expected Nim ${pin.compiler.nim}, got ${toolchain.version}`)
 const paths = []
 const notices = [`Nim ${toolchain.version}\n\n${readFileSync(resolve(toolchain.directory,'copying.txt'),'utf8')}`]
 for(const [name, dependency] of Object.entries(pin)) {
  if(name==='compiler')continue
  const directory=resolve(cache,'dependencies',`${name}-${dependency.revision}`)
  mkdirSync(resolve(cache,'dependencies'),{recursive:true})
  function git(args) {const r=spawnSync('git',args,{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);return r.stdout.trim()}
  if(!existsSync(directory)) {
   git(['clone','--no-checkout',dependency.url,directory])
   git(['-C',directory,'checkout','--detach',dependency.revision])
  }
  if(git(['-C',directory,'rev-parse','HEAD'])!==dependency.revision)throw Error(`Dependency revision mismatch: ${name}`)
  if(git(['-C',directory,'status','--porcelain'])!=='')throw Error(`Dependency source has local changes: ${name}`)
  paths.push(resolve(directory,dependency.sourceDir ?? '.'))
  notices.push(`${name} ${dependency.version ?? dependency.revision}\n${dependency.url}\n\n${readFileSync(resolve(directory,dependency.licenseFile),'utf8')}`)
 }
 writeFileSync(resolve(cache,'NOTICE.txt'),notices.join('\n\n----------------------------------------\n\n')+'\n')
 return paths
}
