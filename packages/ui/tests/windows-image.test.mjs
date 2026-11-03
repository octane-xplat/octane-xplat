import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import ts from 'typescript-classic'

const require = createRequire(import.meta.url)
const runtimeUrl = pathToFileURL(require.resolve('octane/universal/native')).href
const { compile } = await import(pathToFileURL(require.resolve('octane/compiler')))
const { createObjectContainer, createObjectDriver, createUniversalRoot } = await import(runtimeUrl)
const directory = mkdtempSync(join(tmpdir(), 'xplat-windows-image-'))
after(() => rmSync(directory, { recursive: true, force: true }))

function moduleFile(name, code) {
  const path = join(directory, name + '.mjs')
  writeFileSync(path, code)
  return pathToFileURL(path).href
}

function compiled(name, source, imports = {}, template = false) {
  let code = template
    ? compile(source, name + '.tsrx', {
        renderer: {
          id: 'nativescript',
          module: runtimeUrl,
          target: 'universal',
          server: 'unsupported',
          text: 'host',
        },
      }).code
    : source
  code = code.replace(/from\s*(['"])([^'"]+)\1/g, (match, quote, specifier) => {
    const target = specifier === 'octane' ? runtimeUrl : imports[specifier]
    return target ? 'from ' + JSON.stringify(target) : match
  })
  return moduleFile(
    name,
    ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText,
  )
}

const read = (name) =>
  readFileSync(new URL('../src/components/media/' + name, import.meta.url), 'utf8')

const support = moduleFile(
  'support',
  `
export const ImageSource={fromBase64Sync:value=>({base64:value})};
export const isAndroid=false,isIOS=false,Screen={mainScreen:{scale:1}};
export const knownFolders={currentApp:()=>({path:'/app'})};
export const cx=(...values)=>values.flat(Infinity).filter(Boolean).join(' ');
export const mergeStyle=(base,style)=>({...base,...style});
export const styleRecord=style=>style??{};
export const applyEscapeProps=()=>{};
export const layoutChildProps=(props,style)=>({style});
export const isSvgSrc=value=>value.endsWith('.svg');
export const svgSource=value=>value;
export const hashToPngBase64=()=>null;
export const contentFitToStretch=value=>value==='contain'?'aspectFit':'aspectFill';
export const needsContentRect=value=>value==='none';
export const resolveContentFit=value=>value??'cover';
export const resolveContentPosition=value=>value??{top:'50%',left:'50%'};
export const createSizedImageBinding=()=>({update:(view,source)=>{view.src=source}});
export const createImageContentBinding=({issue})=>({update:(host,image,update)=>{if(image)issue(image,update.source)}});
export const bindings=[];
export const bindImageAccessibility=(view,label)=>{const binding={view,label,disposed:false};bindings.push(binding);return()=>{binding.disposed=true}};
export const Microsoft={UI:{Xaml:{Automation:{
 Peers:{AccessibilityView:{Raw:0}},
 AutomationProperties:{GetName:v=>v.name,SetName:(v,name)=>{v.name=name},GetAccessibilityView:v=>v.accessibilityView,SetAccessibilityView:(v,value)=>{v.accessibilityView=value}}
}}}};
`,
)

const raster = compiled('raster-windows', read('raster-source.windows.ts'))
const mobileRaster = compiled('raster-native', read('raster-source.ts'), {
  '@nativescript/core': support,
})

const accessibility = compiled('image-accessibility', read('image-accessibility.windows.ts'), {
  '@octane-xplat/platform/windows': support,
})

const image = compiled(
  'image',
  read('Image.tsrx'),
  Object.fromEntries([
    ...[
      '@nativescript/core',
      '@octane-xplat/lib',
      '../overlays/escape-props',
      '../layout/layout-child',
      './svg',
      './image-sizing',
      './image-content',
      './image-content-binding',
      './hash-image',
      './image-accessibility',
    ].map((specifier) => [specifier, support]),
    ['./raster-source', raster],
  ]),
  true,
)

const avatar = compiled(
  'avatar',
  read('Avatar.windows.tsrx'),
  {
    '../../internal/layout/style-merge': support,
    '@octane-xplat/lib': support,
    '../overlays/escape-props': support,
    './Image.tsrx': image,
  },
  true,
)

const { Image } = await import(image)
const { Avatar } = await import(avatar)
const { bindImageAccessibility } = await import(accessibility)
const { bindings } = await import(support)

function mount(component, props) {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  const nodes = () => {
    const visit = (children) => children.flatMap((node) => [node, ...visit(node.children ?? [])])
    return visit(container.children)
  }
  root.render(component, props)
  return { root, nodes, render: (next) => root.render(component, next) }
}

test('Windows keeps data URIs on the native loader; other native targets retain sync normalization', async () => {
  const source = 'data:image/png;base64,QQ=='
  assert.equal((await import(raster)).resolveRasterSource(source), source)
  assert.deepEqual((await import(mobileRaster)).resolveRasterSource(source), { base64: 'QQ==' })
  for (const source of ['res://portrait', '~/portrait.png', 'https://example.test/portrait.png']) {
    assert.equal((await import(raster)).resolveRasterSource(source), source)
  }
})

test('Image binds the current raster name, disposes on updates/unmount and keeps SVG on its own path', () => {
  const start = bindings.length
  const f = mount(Image, { src: 'data:image/png;base64,QQ==', alt: 'Ada' })
  assert.equal(f.nodes()[0].src, 'data:image/png;base64,QQ==')
  assert.equal(bindings.at(-1).label, 'Ada')
  assert.equal(bindings.at(-1).view, f.nodes()[0])
  f.render({ src: '~/grace.png', alt: 'Grace' })
  assert.equal(f.nodes()[0].src, '~/grace.png')
  assert.equal(bindings.at(-2).disposed, true)
  assert.equal(bindings.at(-1).label, 'Grace')
  f.render({ src: '~/grace.png', alt: 'Grace', contentFit: 'none' })
  assert.equal(bindings.at(-1).view.type, 'image')
  f.render({ src: '~/portrait.svg', alt: 'Vector' })
  assert.equal(f.nodes()[0].type, 'svgview')
  assert.equal(f.nodes()[0].props.accessibilityLabel, 'Vector')
  assert.equal(bindings.at(-1).disposed, true)
  f.root.unmount()
  assert.ok(bindings.slice(start).every((binding) => binding.disposed))
})

test('WinUI names bind after load, restore their previous values, and ignore stale loaded callbacks', () => {
  let loaded
  const image = { name: '' }
  const border = { accessibilityView: 2 }
  const view = {
    isLoaded: false,
    windows: image,
    nativeViewProtected: border,
    on(event, callback) {
      assert.equal(event, 'loaded')
      loaded = callback
    },
    off(event, callback) {
      assert.equal(event, 'loaded')
      assert.equal(callback, loaded)
    },
  }
  const dispose = bindImageAccessibility(view, 'Ada')
  assert.equal(image.name, '')
  loaded()
  assert.equal(image.name, 'Ada')
  assert.equal(border.accessibilityView, 0)
  loaded()
  dispose()
  assert.equal(image.name, '')
  assert.equal(border.accessibilityView, 2)
  loaded()
  assert.equal(image.name, '')
  view.isLoaded = true
  const updated = bindImageAccessibility(view, 'Grace')
  assert.equal(image.name, 'Grace')
  updated()
  assert.equal(image.name, '')
  assert.equal(bindImageAccessibility(null, 'Detached'), undefined)
})

test('Windows Avatar keeps one named image through initials/image updates and bounds its fallback text', () => {
  const f = mount(Avatar, { id: 'avatar', name: 'Ada Lovelace', size: 'lg' })
  assert.equal(f.nodes()[0].props.style.width, 40)
  let images = f.nodes().filter((node) => node.type === 'image')
  assert.equal(images.length, 1)
  assert.equal(images[0].props.accessibilityLabel, 'Ada Lovelace')
  assert.ok(images[0].src.startsWith('data:image/png;base64,'))
  const fallback = f.nodes().find((node) => node.type === 'label')
  assert.equal(fallback.props.text, 'AL')
  assert.equal(fallback.props.style.fontSize, 16)
  assert.equal(fallback.props.style.maxWidth, 40)
  f.render({ name: 'Grace Hopper', alt: 'Admiral', src: '~/portrait.png', size: 'sm' })
  images = f.nodes().filter((node) => node.type === 'image')
  assert.equal(images.length, 1)
  assert.equal(images[0].props.accessibilityLabel, 'Admiral')
  assert.equal(images[0].src, '~/portrait.png')
  assert.equal(f.nodes().filter((node) => node.type === 'label').length, 0)
  f.render({ name: 'Grace Hopper', fallback: 'GH', status: 'success' })
  assert.equal(f.nodes().find((node) => node.type === 'label').props.text, 'GH')
  const status = f.nodes().find((node) => node.props.className?.includes('vx-avatar-status'))
  assert.equal(status.props.accessibilityLabel, 'Grace Hopper is success')
  assert.equal(status.props.style.position, 'absolute')
  f.root.unmount()
})
