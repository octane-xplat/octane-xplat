// Build-time public ABI only; no runtime library/model download during CLI builds.
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
const root=resolve(import.meta.dirname,'../..')
export const ortPin=JSON.parse(readFileSync(new URL('./ort-runtime.json',import.meta.url)))
export const ortHeaderDir=join(root,'research/nim-cli/ort-headers',ortPin.version)
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
export async function prepareOrtHeaders() {
 mkdirSync(ortHeaderDir,{recursive:true})
 const target=ortPin.targets['darwin-arm64']
 const archive=join(root,'research/nim-cli/runtime-fixtures',target.directory+'.tgz')
 const verifiedArchive=existsSync(archive)&&sha(readFileSync(archive))===target.sha256
 for(const [name,pin] of Object.entries(ortPin.headers)){
  const path=join(ortHeaderDir,name)
  if(existsSync(path)&&sha(readFileSync(path))===pin.sha256){continue}
  let bytes
  if(verifiedArchive){
   const result=spawnSync('tar',['-xOzf',archive,target.directory+'/include/'+name],{maxBuffer:2*1024*1024})
   if(result.status!==0){throw Error('Pinned header extraction failed: '+name)}
   bytes=result.stdout
  }else{
   const response=await fetch(`https://raw.githubusercontent.com/microsoft/onnxruntime/v${ortPin.version}/include/onnxruntime/core/session/${name}`,{signal:AbortSignal.timeout(120000)})
   if(!response.ok){throw Error('Pinned ONNX header download failed: '+name)}
   bytes=Buffer.from(await response.arrayBuffer())
  }
  if(bytes.length!==pin.bytes||sha(bytes)!==pin.sha256){throw Error('Pinned ONNX header checksum mismatch: '+name)}
  const staging=path+'.'+randomUUID()+'.tmp'
  try{writeFileSync(staging,bytes);renameSync(staging,path)}finally{rmSync(staging,{force:true})}
 }
 return ortHeaderDir
}
