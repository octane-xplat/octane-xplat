// Stage native CLI plus bounded plugins/workers; leave the TypeScript reference in the repository.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { scratchRun } from './scratch.mjs'
const root=resolve(import.meta.dirname,'../..')
const hostOnly=process.argv.includes('--host-only') // local qualification, never publication
const destination=process.argv.indexOf('--destination')
if(destination>=0&&(!process.argv[destination+1]||process.argv[destination+1].startsWith('--'))){throw Error('--destination needs a directory')}
const build=JSON.parse(readFileSync(resolve(root,'research/nim-cli/native/build.json')))
const version=process.env.XPLAT_NIM_VERSION ?? build.version
if (!/^\d+\.\d+\.\d+-nim\.[0-9]+$/.test(version)) {throw Error('Require x.y.z-nim.N')}
const stage=scratchRun(root,'npm-stage')
const source=resolve(root,'packages/cli')
const pkg=JSON.parse(readFileSync(join(source,'package.json')))
// Avoid a runtime wrapper: npm links directly to the binary copied at install.
for (const key of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies", "exports", "types", "main", "module"]) {delete pkg[key]}
pkg.version=version;pkg.bin={xplat:'bin/xplat.exe'};pkg.scripts={postinstall:'node install-native.mjs'}
pkg.files=['bin','native','dist','install-native.mjs'];pkg.publishConfig={access:'public',tag:'nim'}
// Reuse the curated closure, not the full TypeScript CLI dist. Heavy engines
// are optional peers: only projects using these exports install them.
const plugins = JSON.parse(readFileSync(resolve(root,'packages/build/package.json')))
pkg.exports = plugins.exports
pkg.peerDependencies = { ...plugins.dependencies, ...plugins.peerDependencies }
for (const [name, range] of Object.entries(pkg.peerDependencies)) {
 if (range === 'workspace:*') {
  const manifest = JSON.parse(readFileSync(resolve(root,'packages',name.split('/')[1],'package.json')))
  pkg.peerDependencies[name] = manifest.version
 }
}
pkg.peerDependenciesMeta = Object.fromEntries(Object.keys(pkg.peerDependencies).map(name => [name,{ optional: true }]))
cpSync(resolve(root,'packages/build/dist'),join(stage,'dist'),{recursive:true})
mkdirSync(join(stage,'bin'));mkdirSync(join(stage,'native'))
cpSync(resolve(root,'LICENSE'),join(stage,'LICENSE'))
cpSync(resolve(import.meta.dirname,'install-native.mjs'),join(stage,'install-native.mjs'))
cpSync(resolve(root,'research/nim-cli/native/NOTICE.txt'),join(stage,'native/NOTICE.txt'))
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
writeFileSync(join(stage,'package.json'),JSON.stringify(pkg,null,2)+'\n')
const out=destination<0?resolve(root,'research/nim-cli/package'):resolve(process.argv[destination+1]);mkdirSync(out,{recursive:true})
const packed=spawnSync('bun',['pm','pack','--destination',out],{cwd:stage,stdio:'inherit'})
if(packed.status!==0){throw Error('Pack failed')}
writeFileSync(join(out,'stage.json'),JSON.stringify({stage,version,hostOnly}))
console.log(`Staged ${pkg.name}@${version}; tag nim; hostOnly=${hostOnly}`)
