// Stage the existing JS package exports with a native bin; never modify its manifest.
import { cpSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
const root=resolve(import.meta.dirname,'../..')
const hostOnly=process.argv.includes('--host-only') // local qualification, never publication
const build=JSON.parse(readFileSync(resolve(root,'research/nim-cli/native/build.json')))
const version=process.env.XPLAT_NIM_VERSION ?? build.version
if (!/^\d+\.\d+\.\d+-nim\.[0-9]+$/.test(version)) throw Error('Require x.y.z-nim.N')
const stage=mkdtempSync(join(tmpdir(),'xplat-nim-package-'))
const source=resolve(root,'packages/cli')
const pkg=JSON.parse(readFileSync(join(source,'package.json')))
// Avoid a runtime wrapper: npm links directly to the binary copied at install.
delete pkg.devDependencies;
pkg.version=version;pkg.bin={xplat:'bin/xplat.exe'};pkg.scripts={postinstall:'node install-native.mjs'}
pkg.files=['src','dist','patches','bin','native','install-native.mjs','!dist/xplat','!dist/xplat.exe'];pkg.publishConfig={access:'public',tag:'nim'}
for (const directory of ['src','dist','patches']) cpSync(join(source,directory),join(stage,directory),{recursive:true})
mkdirSync(join(stage,'bin'));mkdirSync(join(stage,'native'))
cpSync(resolve(import.meta.dirname,'install-native.mjs'),join(stage,'install-native.mjs'))
writeFileSync(join(stage,'bin/xplat.exe'),'#!/bin/sh\necho "Run the package postinstall to select the native CLI" >&2\nexit 3\n',{mode:0o755})
const hosts=['darwin-arm64','darwin-x64','linux-arm64','linux-x64','win32-x64']
const selected=hostOnly?[`${process.platform}-${process.arch}`]:hosts
const manifest={}
for(const target of selected) {
 const file=`xplat-${target}${target.startsWith('win32')?'.exe':''}`
 const from=hostOnly?resolve(root,`research/nim-cli/native/xplat${process.platform==='win32'?'.exe':''}`):resolve(root,'research/nim-cli/artifacts',file)
 const bytes=readFileSync(from)
 cpSync(from,join(stage,'native',file));manifest[target]={file,sha256:createHash('sha256').update(bytes).digest('hex')}
}
if(hostOnly){pkg.private=true;pkg.os=[process.platform];pkg.cpu=[process.arch]}
writeFileSync(join(stage,'native/manifest.json'),JSON.stringify(manifest,null,2))
// Resolve workspace: dependencies using the current source versions, as lockstep packing does.
for(const [name,spec] of Object.entries(pkg.dependencies)) {
 if(spec!=='workspace:*')continue
 const {publishablePackages}=await import('../../scripts/publishable.ts')
 const match=publishablePackages(root).find(p=>p.name===name)
 if(!match)throw Error(`Cannot resolve ${name}`)
 pkg.dependencies[name]=match.version
}
writeFileSync(join(stage,'package.json'),JSON.stringify(pkg,null,2)+'\n')
const out=resolve(root,'research/nim-cli/package');mkdirSync(out,{recursive:true})
const packed=spawnSync('bun',['pm','pack','--destination',out],{cwd:stage,stdio:'inherit'})
if(packed.status!==0)throw Error('Pack failed')
writeFileSync(join(out,'stage.json'),JSON.stringify({stage,version,hostOnly}))
console.log(`Staged ${pkg.name}@${version}; tag nim; hostOnly=${hostOnly}`)
