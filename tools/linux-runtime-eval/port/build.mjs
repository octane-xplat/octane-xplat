import { build } from 'vite'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { linuxGtk } from '../../../packages/cli/src/linux-gtk/vite.ts'
const root=resolve(import.meta.dirname,'..')
const schemaPath=resolve(root,'../../research/linux-runtime-port/gi.json')
const watch=process.argv.includes('--watch')?{}:undefined
// Typelibs absent on the probe VM — leaf-only imports the parity screen never
// reaches (webview/networking). Stubbed to a tolerant proxy for the GJS build.
const GJS_STUB_NS=new Set(['Soup','WebKit','JavaScriptCore','Xdp','Adw'])
const gjsStubPlugin={name:'gjs-stub-missing-typelibs',enforce:'pre',
  resolveId(id){const m=id.match(/^gi:\/\/(\w+)/);return m&&GJS_STUB_NS.has(m[1])?'\0gjs-stub':null},
  load(id){return id==='\0gjs-stub'?'const p=new Proxy(function(){},{get:()=>p,apply:()=>p,construct:()=>p});export default p':null}}
// Two targets from the same screen:
//  - port-native: gi:// specifiers are projected onto the NativeScript C
//    runtime through bindings.mjs + the exported GI schema.
//  - port-gjs:    gi:// stays external for `gjs -m` — the shipping GI path,
//    used for geometry parity against the projected runtime.
for(const target of [
  {name:'port-native',entry:'port/main.mjs',projection:true},
  {name:'port-gjs',entry:'port/gjs-main.mjs',projection:false},
]){
  if(target.projection&&!existsSync(schemaPath))throw Error(`GI schema missing: ${schemaPath} — export it on the Linux host: XPLAT_MASON_TYPELIB=<facade> LD_LIBRARY_PATH=<facade> gjs tools/linux-runtime-eval/port/export-gi.js research/linux-runtime-port/gi.json`)
  const base=await linuxGtk('production',{root,entry:target.entry,outDir:`dist/${target.name}`})
  const plugins=target.projection?[{
    name:'native-gi-projection', enforce:'pre',
    resolveId(id){if(id==='virtual:gtk-schema')return '\0gtk-schema';if(id.startsWith('gi://'))return '\0gi:'+id.slice(5).split('?')[0]},
    load(id){if(id==='\0gtk-schema'){this.addWatchFile(schemaPath);return 'export default '+readFileSync(schemaPath,'utf8')};if(id.startsWith('\0gi:'))return `import {namespaces} from ${JSON.stringify(resolve(import.meta.dirname,'bindings.mjs'))};export default namespaces[${JSON.stringify(id.slice(4))}];`},
  },...base.plugins]:[gjsStubPlugin,...base.plugins]
  await build({...base,plugins,build:{...base.build,watch,minify:false,rollupOptions:{...base.build.rollupOptions,external:target.projection?()=>false:(id)=>id.startsWith('gi://')&&!GJS_STUB_NS.has(id.slice(5).split('?')[0])}}})
}
