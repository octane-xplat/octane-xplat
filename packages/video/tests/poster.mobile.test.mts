import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const runtimeUrl = pathToFileURL(require.resolve('octane/universal/native')).href
const { compile } = await import(pathToFileURL(require.resolve('octane/compiler')).href)
const { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalAct } =
  await import(runtimeUrl)

const directory = mkdtempSync(join(tmpdir(), 'xplat-video-poster-'))

after(() => rmSync(directory, { recursive: true, force: true }))

function moduleFile(name: string, code: string) {
  const path = join(directory, name + '.mjs')

  writeFileSync(path, stripTypeScriptTypes(code))
  return pathToFileURL(path).href
}

const support = moduleFile(
  'support',
  `
export * from ${JSON.stringify(runtimeUrl)};
export const registerElement=()=>{};
export const isAndroid=false;
export class Video {}
export const VideoFill={aspect:0,aspectFill:1,fill:2};
export const applyEscapeProps=()=>{};
export const nativeAccessibilityRole=value=>value,nativeAccessibilityState=value=>value;
export const layoutChildProps=(props,style)=>({style});
export const seekToTime=()=>{};
`,
)

function compiled(name: string, source: string, imports: Record<string, string> = {}) {
  const { code } = compile(source, name + '.tsrx', {
    renderer: {
      id: 'nativescript',
      module: runtimeUrl,
      target: 'universal',
      server: 'unsupported',
      text: 'host',
    },
  })

  return moduleFile(
    name,
    code.replace(
      /from\s*(['"])([^'"]+)\1/g,
      (_match: string, _quote: string, specifier: string) =>
        'from ' +
        JSON.stringify(specifier === 'octane' ? runtimeUrl : (imports[specifier] ?? support)),
    ),
  )
}

const primitives = compiled(
  'primitives',
  `
export function Image(props) @{ <image {...props} /> }
export function VideoChrome(props) @{ <>
  @if (props.poster && !props.started) { <image src={props.poster} /> }
  <controls />
</> }
`,
)

const video = compiled(
  'video',
  readFileSync(new URL('../src/Video.tsrx', import.meta.url), 'utf8'),
  {
    '@octane-xplat/ui': primitives,
    './video-chrome.tsrx': primitives,
  },
)

const { Video } = await import(video)

for (const controls of [false, true]) {
  test(`poster and player ownership follow component lifetime (controls=${controls})`, async () => {
    const container = createObjectContainer('nativescript')
    const destroyCounts = new Map<object, number>()
    const driver = createObjectDriver('nativescript')
    const getPublicInstance = driver.getPublicInstance.bind(driver)

    driver.getPublicInstance = (...args) => {
      const host = getPublicInstance(...args)

      if (host && typeof host === 'object' && !destroyCounts.has(host)) {
        destroyCounts.set(host, 0)
        Object.assign(host, {
          destroy: () => destroyCounts.set(host, destroyCounts.get(host)! + 1),
        })
      }

      return host
    }

    const root = createUniversalRoot(container, driver)
    const nodes = (): any[] => {
      const visit = (children: any[]): any[] =>
        children.flatMap((node) => [node, ...visit(node.children ?? [])])

      return visit(container.children)
    }

    const render = async (src: string, poster?: string) => {
      flushUniversalAct(() => root.render(Video, { src, poster, controls }))
      // Let passive effects acquire/update the public player before checking disposal.
      await new Promise((resolve) => setTimeout(resolve, 0))
      assert.ok([...destroyCounts.values()].every((count) => count === 0))
    }

    const posters = () =>
      nodes()
        .filter((node) => node.type === 'image')
        .map((node) => node.props.src)

    const start = () =>
      flushUniversalAct(() =>
        container.dispatchEvent(
          nodes().find((node) => node.type === 'xplatvideo'),
          'playbackStart',
          {},
        ),
      )

    try {
      await render('one.mp4', 'one.jpg')
      assert.deepEqual(posters(), ['one.jpg'])
      assert.equal(
        nodes().some((node) => node.type === 'controls'),
        controls,
      )

      start()
      assert.deepEqual(posters(), [])
      await render('two.mp4', 'two.jpg')
      assert.deepEqual(posters(), ['two.jpg'])
      await render('two.mp4', 'updated.jpg')
      assert.deepEqual(posters(), ['updated.jpg'])
      start()
      assert.deepEqual(posters(), [])
      await render('three.mp4')
      assert.deepEqual(posters(), [])
    } finally {
      root.unmount()
      await new Promise((resolve) => setTimeout(resolve, 0))
      assert.ok(destroyCounts.size > 0)
      assert.deepEqual([...destroyCounts.values()], [1])
    }
  })
}
