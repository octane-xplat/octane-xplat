// NativeScript runtime fixture. No Vite, Octane, package imports, or app data.
import http from 'node:http'
const port = Number(process.env.PORT ?? 18773)
const origin = `http://127.0.0.1:${port}`
const counts = new Map()
const started = Date.now()
const server = http.createServer((request,response)=>{
  const path = new URL(request.url,origin).pathname
  const count = (counts.get(path)??0)+1
  counts.set(path,count)
  const elapsed = Date.now()-started
  console.log(JSON.stringify({event:'request',path,count,ms:elapsed}))
  const slow = path === '/timeout/slow.mjs' && count <= 2
  let code
  if(path === '/driver.mjs') {
    code = `const start=Date.now();\nconsole.log('[graph-repro] control', (await import('${origin}/control/entry.mjs')).value);\nconsole.log('[graph-repro] timeout', (await import('${origin}/timeout/entry.mjs')).value, Date.now()-start);\n`
  } else if(/^\/(control|timeout)\/entry\.mjs$/.test(path)) {
    code = `export { value } from './slow.mjs';`
  } else if(/^\/(control|timeout)\/slow\.mjs$/.test(path)) {
    code = `export * from './branch.mjs';`
  } else if(/^\/(control|timeout)\/branch\.mjs$/.test(path)) {
    code = `import { n } from './leaf.mjs'; export const value=n+1;`
  } else if(/^\/(control|timeout)\/leaf\.mjs$/.test(path)) {
    code = 'export const n=41;'
  }
  if(code === undefined) {response.writeHead(404);response.end();return}
  setTimeout(()=>{
    response.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'})
    response.end(code)
    console.log(JSON.stringify({event:'response',path,count,ms:Date.now()-started}))
  },slow ? 6000 : 0)
})
server.listen(port,'127.0.0.1',()=>{
  console.log(`NativeScript debug main.mjs: await import('${origin}/driver.mjs')`)
})
process.on('SIGINT',()=>{server.closeAllConnections();server.close()})
