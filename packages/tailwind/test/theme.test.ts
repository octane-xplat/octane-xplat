import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import postcss from 'postcss'
import { createServer } from 'vite'
import {
  computeCascade,
  registerStylesheet,
  unregisterStylesheet,
  type CssHostNode,
} from '@octane-xplat/css-engine'

import { defaultThemeTokens } from '../../ui/src/theme/astryx-default-tokens.ts'
import { tailwindCompiler } from '../src/compiler.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const chrome = await readFile(new URL('../../ui/src/theme/chrome.css', import.meta.url), 'utf8')
const bridge = await readFile(new URL('../src/ui-theme.css', import.meta.url), 'utf8')
const entry = (await readFile(new URL('../src/index.css', import.meta.url), 'utf8'))
  .replace('./theme.css', './src/theme.css')
  .replace('layer(utilities);', 'layer(utilities) source(none);')

async function compile(target: 'web' | 'ios') {
  return postcss([tailwindCompiler({ root, target })]).process(
    `${entry}
@import './src/ui-theme.css';
@source inline("bg-primary bg-accent text-text-primary rounded-container");`,
    { from: `${root}/theme-case.css` },
  )
}

test('UI bridge registers the current color/radius token names without copying values', () => {
  const expected = new Set(
    Object.keys(defaultThemeTokens).filter((name) => /^--(?:color|radius)-/.test(name)),
  )

  postcss.parse(chrome).walkDecls((declaration) => {
    if (/^--(?:color|radius)-/.test(declaration.prop)) {
      expected.add(declaration.prop)
    }
  })

  const registered = new Set<string>()

  postcss.parse(bridge).walkDecls((declaration) => {
    registered.add(declaration.prop)
    assert.equal(declaration.value, `var(${declaration.prop})`)
    assert.equal(declaration.parent?.type, 'atrule')
    if (declaration.parent?.type === 'atrule') {
      assert.equal(declaration.parent.params, 'reference inline')
    }
  })

  assert.deepEqual([...registered].sort(), [...expected].sort())
})

test('UI utilities keep runtime references without emitting cyclic token declarations', async () => {
  for (const target of ['web', 'ios'] as const) {
    const result = await compile(target)

    assert.match(result.css, /background-color:\s*var\(--color-primary\)/)
    assert.match(result.css, /background-color:\s*var\(--color-accent\)/)
    assert.match(result.css, /border-radius:\s*var\(--radius-container\)/)
    result.root.walkDecls((declaration) => {
      assert.ok(
        !/^--(?:color-primary|color-accent|radius-container)$/.test(declaration.prop),
        `${target}: runtime token must remain owned by UI`,
      )
    })

    assert.doesNotMatch(result.css, /@theme|@reference/)
  }
})

test('component styles work without curated helpers and the optional sheet retains their documented values', async () => {
  const structure = await readFile(
    new URL('../../ui/src/theme/tokens.css', import.meta.url),
    'utf8',
  )

  const utilities = await readFile(
    new URL('../../ui/src/theme/utilities.css', import.meta.url),
    'utf8',
  )

  const base = `${structure}\n${chrome}`
  const utilityNames: string[] = []

  postcss.parse(utilities).walkRules((rule) => {
    if (/^\.[\w-]+$/.test(rule.selector)) {
      utilityNames.push(rule.selector.slice(1))
    }
  })

  postcss.parse(base).walkRules((rule) => {
    for (const name of utilityNames) {
      assert.ok(
        !new RegExp(`\\.${name}(?![\\w-])`).test(rule.selector),
        `Required UI styles still define utility ${name}: ${rule.selector}`,
      )
    }
  })

  const styleFor = (css: string, classes: string[], childClasses?: string[]) => {
    registerStylesheet('utility-choice-test', css)
    try {
      const parent: CssHostNode = {
        cssType: 'masonview',
        cssClasses: new Set(['ns-root', 'vx-app']),
        props: {},
      }

      const inherited = computeCascade(parent)

      parent.computedStyle = inherited.style
      parent.computedCustomProps = inherited.customProps

      const element: CssHostNode = {
        cssType: childClasses ? 'masonview' : 'label',
        cssClasses: new Set(classes),
        parent,
        props: {},
      }

      const cascade = computeCascade(element)

      if (!childClasses) {
        return cascade.style
      }

      element.computedStyle = cascade.style
      element.computedCustomProps = cascade.customProps
      return computeCascade({
        cssType: 'label',
        cssClasses: new Set(childClasses),
        parent: element,
        props: {},
      }).style
    } finally {
      unregisterStylesheet('utility-choice-test')
    }
  }

  const small = styleFor(base, ['vx-type-small', 'vx-ink-muted'])

  assert.equal(small.fontSize, 13)
  assert.equal(small.lineHeight, 20)
  assert.equal(small.minHeight, 20)
  assert.equal(small.color, '#4e606f')

  const primary = styleFor(base, ['vx-alertdialog-action--primary'])

  assert.equal(primary.backgroundColor, '#0064e0')
  assert.equal(primary.color, '#ffffff')

  const actionLabel = styleFor(base, ['vx-alertdialog-action--primary'], ['vx-button-label'])

  assert.equal(actionLabel.color, '#ffffff')
  assert.equal(actionLabel.backgroundColor, undefined)

  const helper = styleFor(`${base}\n${utilities}`, ['text-sm', 'rounded-lg', 'gap-4'])

  assert.equal(helper.fontSize, 13)
  assert.equal(helper.minHeight, 20)
  assert.equal(helper.borderRadius, 12)
  assert.equal(helper.cornerShape, 'squircle')
  assert.equal(helper.rowGap, 16)

  const override = styleFor(`${base}\n${utilities}\n.custom { gap: 12px }`, ['gap-4', 'custom'])

  assert.equal(override.rowGap, 12)
})

test('compiled UI utilities follow actual theme emission across dark and explicit-light scopes', async () => {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true },
  })

  let themeCss: string

  try {
    const generator = await server.ssrLoadModule(
      fileURLToPath(new URL('../../ui/src/theme/theme-css.ts', import.meta.url)),
    )

    themeCss = generator.generateThemeCss(
      {
        name: 'tailwind-test',
        tokens: {
          '--color-primary': ['#112233', '#445566'],
          '--color-accent': ['#aabbcc', '#ddeeff'],
          '--radius-container': '22px',
        },
      },
      { target: 'native' },
    )
  } finally {
    await server.close()
  }

  const compiled = await compile('ios')

  registerStylesheet('tailwind-ui-theme-test', `${chrome}\n${themeCss}\n${compiled.css}`)
  try {
    const styled = (classes: string[], parent?: CssHostNode): CssHostNode => {
      const node: CssHostNode = {
        cssType: 'masonview',
        cssClasses: new Set(classes),
        parent,
        props: {},
      }

      const cascade = computeCascade(node)

      node.computedStyle = cascade.style
      node.computedCustomProps = cascade.customProps
      return node
    }

    for (const [rootClasses, scopeClasses, color] of [
      [['ns-root'], [], '#0064e0'],
      [['ns-root', 'dark'], [], '#2694fe'],
      [['ns-root'], ['xds-theme-tailwind-test'], '#112233'],
      [['ns-root', 'dark'], ['xds-theme-tailwind-test'], '#445566'],
      [['ns-root', 'dark'], ['xds-theme-tailwind-test', 'xds-light'], '#112233'],
      [['ns-root'], ['xds-theme-tailwind-test', 'dark'], '#445566'],
    ] as const) {
      const ancestor = styled([...rootClasses])
      const scope = styled([...scopeClasses], ancestor)
      const child = styled(['bg-primary', 'rounded-container'], scope)

      assert.equal(child.computedStyle?.backgroundColor, color, `${rootClasses}/${scopeClasses}`)
      if (scopeClasses.length > 0) {
        assert.equal(child.computedStyle?.borderRadius, 22)
      }
    }
  } finally {
    unregisterStylesheet('tailwind-ui-theme-test')
  }
})
