// Independent reference process: use the original discovery checks and Node I/O.
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { checkPrerequisites } from '../../packages/cli/src/mcp/discovery.ts'
const request = JSON.parse(readFileSync(0,'utf8'))
let value
if (request.operation === 'command-probe') {
 try { value = execFileSync(request.cmd,request.args,{cwd:request.dir,env:{...process.env,...request.env},
  encoding:'utf8',timeout:request.timeoutMs ?? 15000,maxBuffer:request.limit ?? 1024*1024,stdio:['ignore','pipe','ignore']}) }
 catch { value = null }
} else value = checkPrerequisites(request.platforms)
console.log(JSON.stringify({ok:true,value}))
