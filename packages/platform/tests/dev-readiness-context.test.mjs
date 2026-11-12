import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import ts from 'typescript-classic'

const require = createRequire(import.meta.url)
const runtime = pathToFileURL(require.resolve('octane/universal/native')).href
const { compile } = await import(pathToFileURL(require.resolve('octane/compiler')))
const { createObjectContainer, createObjectDriver, createUniversalRoot } = await import(runtime)

test('compiled context owns nested readiness leases across updates and unmount', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'xplat-dev-readiness-'))
  const file = (name, source, imports = {}, component = false) => {
    if (component) {
      source = compile(source, name + '.tsx', {
        renderer: {
          id: 'nativescript',
          module: runtime,
          target: 'universal',
          server: 'unsupported',
          text: 'host',
        },
      }).code
    }

    const code = ts
      .transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      })
      .outputText.replace(/from\s*(['"])([^'"]+)\1/g, (match, quote, id) => {
        const target = id === 'octane' ? runtime : imports[id]

        return target ? 'from ' + JSON.stringify(target) : match
      })

    const path = join(directory, name + '.mjs')

    writeFileSync(path, code)
    return pathToFileURL(path).href
  }

  let root

  try {
    const state = file(
      'state',
      readFileSync(new URL('../src/dev-readiness-state.ts', import.meta.url), 'utf8'),
    )

    const context = file(
      'context',
      readFileSync(new URL('../src/dev-readiness-context.ts', import.meta.url), 'utf8'),
    )

    const hooks = file(
      'hooks',
      readFileSync(new URL('../src/dev-readiness.tsrx', import.meta.url), 'utf8'),
      { './dev-readiness-state': state, './dev-readiness-context': context },
      true,
    )

    const work = file(
      'work',
      readFileSync(new URL('../src/use-dev-readiness.tsrx', import.meta.url), 'utf8'),
      { './dev-readiness-context': context },
      true,
    )

    // The maintained example must also lower through the native compiler.
    compile(
      readFileSync(
        new URL('../../../examples/dev-actions/readiness.tsrx', import.meta.url),
        'utf8',
      ),
      'readiness-example.tsrx',
      {
        renderer: {
          id: 'nativescript',
          module: runtime,
          target: 'universal',
          server: 'unsupported',
          text: 'host',
        },
      },
    )

    const sourceHook = file(
      'source-hook',
      readFileSync(new URL('../src/use-dev-readiness-source.tsrx', import.meta.url), 'utf8'),
      { './dev-readiness-context': context },
      true,
    )

    const schema = file(
      'schema',
      readFileSync(new URL('../src/dev-actions-schema.ts', import.meta.url), 'utf8'),
    )

    const bridge = file(
      'bridge',
      'export const devBridgeEndpoint=()=>null; export const devBridgePlatform=()=>"ios"; export const devBridgeSocket=()=>null;',
    )

    const registry = file(
      'registry',
      readFileSync(new URL('../src/dev-actions-registry.ts', import.meta.url), 'utf8'),
      { './dev-actions-schema': schema, './dev-bridge': bridge, './dev-readiness-state': state },
    )

    const actions = file(
      'action-hooks',
      readFileSync(new URL('../src/use-dev-action.tsrx', import.meta.url), 'utf8'),
      { './dev-actions-registry': registry, './dev-readiness-context': context },
      true,
    )

    const { listDevActions } = await import(registry)
    const fixture = file(
      'fixture',
      `import {useContext} from 'octane';
import {DevReadinessContext} from 'context';
import {DevActionScope} from 'hooks';
import {useDevReadiness} from 'work';
import {useDevReadinessSource} from 'source-hook';
import {useDevAction} from 'actions';
export function Child(props) {
 const scope=useContext(DevReadinessContext);
 useDevReadiness(props.pending,'Image');
 if(props.source) useDevReadinessSource(props.source,value=>value,'Query');
 useDevAction({id:'fixture.context',title:'Context fixture',description:'Owned fixture',effects:{summary:'Read only'},run:()=>({})},{label:'Child'});
 useDevAction({id:'fixture.diagnostics',title:'Diagnostics fixture',description:'Owned diagnostics',effects:{summary:'Read only'},run:()=>({})},{label:'Diagnostics',waitForReadiness:false});
 props.capture(scope);
 return <label text={props.pending?'Loading':'Ready'}/>;
}
export function App(props) {return <DevActionScope label="Root"><DevActionScope label="Nested"><Child pending={props.pending} capture={props.capture} source={props.source}/></DevActionScope></DevActionScope>;}`,
      { context, hooks, work, 'source-hook': sourceHook, actions },
      true,
    )

    const { App } = await import(fixture)
    const host = createObjectContainer('nativescript')

    root = createUniversalRoot(host, createObjectDriver('nativescript'))

    let scope
    const capture = (value) => {
      scope = value
    }

    const until = async (predicate) => {
      for (let i = 0; i < 100; i++) {
        if (predicate()) {
          return
        }

        await new Promise((resolve) => setTimeout(resolve, 5))
      }

      assert.fail('Context update did not commit')
    }

    root.render(App, { pending: true, capture })
    await until(() => scope?.snapshot().pending.length === 1)

    assert.deepEqual(
      listDevActions().find((action) => action.id === 'fixture.context').readiness[0].pending,
      ['Image'],
    )

    assert.deepEqual(
      listDevActions().find((action) => action.id === 'fixture.diagnostics').readiness,
      [],
    )

    const initial = scope
    const controller = new AbortController()
    const wait = scope.wait({ signal: controller.signal, timeoutMs: 1000 })

    root.render(App, { pending: false, capture })
    await wait
    assert.equal(scope, initial)
    assert.deepEqual(scope.snapshot().pending, [])

    let pending = true,
      notify

    const source = {
      get: () => pending,
      subscribe: (fn) => {
        notify = fn
        return () => {
          notify = undefined
        }
      },
    }

    root.render(App, { pending: false, capture, source })
    await until(() => scope.snapshot().pending[0] === 'Query')
    pending = false
    notify()
    await scope.wait({ signal: controller.signal, timeoutMs: 1000 })
    assert.deepEqual(scope.snapshot().pending, [])
    root.render(App, { pending: true, capture })
    await until(() => scope.snapshot().pending.length === 1)

    const unmounted = scope.wait({ signal: controller.signal, timeoutMs: 1000 })

    root.unmount()
    root = undefined
    await assert.rejects(unmounted, { code: 'readiness_disposed' })
  } finally {
    root?.unmount()
    rmSync(directory, { recursive: true, force: true })
  }
})
