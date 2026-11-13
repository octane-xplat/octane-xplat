import { compile } from 'octane/compiler'
// octane ships no typings for this subpath.
// @ts-expect-error
import { resolveRendererForFile } from 'octane/compiler/renderers'
import { describe, expect, it } from 'vitest'
import {
  NATIVESCRIPT_RENDERER_ID,
  nativeScriptRenderer,
  nativeScriptRendererValidation,
  nativeScriptRenderers,
} from './config.js'

describe('nativeScriptRenderer', () => {
  it('points the compiler at the package renderer ABI and intrinsics', () => {
    expect(nativeScriptRenderer.module).toBe('@octane-xplat/nativescript-octane')
    expect(nativeScriptRenderer.intrinsics).toBe('@octane-xplat/nativescript-octane')
    expect(nativeScriptRenderer.target).toBe('universal')
    expect(nativeScriptRenderer.server).toBe('unsupported')
    expect(nativeScriptRenderer.text).toBe('host')
  })
})

describe('nativeScriptRendererValidation', () => {
  it('forbids DOM globals and DOM-side entries, not what NativeScript provides', () => {
    const { forbiddenGlobals, forbiddenImports } = nativeScriptRenderer.validation
    expect(forbiddenGlobals).toEqual(expect.arrayContaining(['document', 'window', 'localStorage']))
    for (const provided of [
      'fetch',
      'XMLHttpRequest',
      'alert',
      'confirm',
      'matchMedia',
      'requestAnimationFrame',
      'crypto',
      'WebSocket',
      'TextEncoder',
      'FormData',
    ]) {
      expect(forbiddenGlobals).not.toContain(provided)
    }
    expect(forbiddenImports).toEqual(expect.arrayContaining(['octane/hydration', 'react-dom']))
    expect(forbiddenImports).not.toContain('octane')
  })

  it('fails compilation of a renderer-owned module that reaches for the DOM', () => {
    const options = {
      mode: 'client',
      dev: true,
      renderer: { id: NATIVESCRIPT_RENDERER_ID, ...nativeScriptRenderer },
      rendererRegistry: {
        [NATIVESCRIPT_RENDERER_ID]: {
          module: nativeScriptRenderer.module,
          target: 'universal',
          server: 'unsupported',
        },
      },
    } as const
    const compileModule = (source: string, name: string) => () =>
      compile(source, `/src/${name}.tsx`, options)

    expect(
      compileModule('export function A() { return <label text={document.title} />; }', 'a'),
    ).toThrow(/forbids unbound global "document"/)
    expect(
      compileModule(
        'import \'react-dom/client\';\nexport function B() { return <label text="b" />; }',
        'b',
      ),
    ).toThrow(/forbids static import "react-dom\/client"/)
    expect(
      compileModule('export function C() { return <label text={String(fetch)} />; }', 'c'),
    ).not.toThrow()
  })
})

describe('nativeScriptRenderers', () => {
  it('scopes the renderer to .tsx and .tsrx modules by default', () => {
    const config = nativeScriptRenderers()
    expect(config.registry[NATIVESCRIPT_RENDERER_ID]).toBe(nativeScriptRenderer)
    expect(config.rules).toEqual([
      { include: 'src/**/*.{tsx,tsrx}', renderer: NATIVESCRIPT_RENDERER_ID },
    ])
    for (const file of ['/src/App.tsx', '/src/components/Greeting.tsrx']) {
      expect(resolveRendererForFile(config, file).id).toBe(NATIVESCRIPT_RENDERER_ID)
    }
    expect(resolveRendererForFile(config, '/src/state/store.ts').id).not.toBe(
      NATIVESCRIPT_RENDERER_ID,
    )
  })

  it('merges a validation override over the defaults and accepts false', () => {
    const merged = nativeScriptRenderers({
      validation: { forbiddenGlobals: ['CustomEvent'] },
    }).registry[NATIVESCRIPT_RENDERER_ID]
    expect(merged).toHaveProperty('validation', {
      forbiddenGlobals: ['CustomEvent'],
      forbiddenImports: nativeScriptRendererValidation.forbiddenImports,
    })
    expect(
      nativeScriptRenderers({ validation: false }).registry[NATIVESCRIPT_RENDERER_ID],
    ).not.toHaveProperty('validation')
  })

  it('accepts a custom include glob', () => {
    expect(nativeScriptRenderers({ include: 'app/**/*.tsx' }).rules[0].include).toBe('app/**/*.tsx')
  })
})
