import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import {
  computeCascade,
  registerStylesheet,
  unregisterStylesheet,
  setStyleEnvironment,
  type CssHostNode,
} from '@octane-xplat/css-engine'

import { tailwindCompiler } from '../src/compiler.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const entry = (await readFile(`${root}/src/index.css`, 'utf8'))
  .replace('./theme.css', './src/theme.css')
  .replace('layer(utilities);', 'layer(utilities) source(none);')

async function compile(classes: string, extra = '') {
  const result = await postcss([tailwindCompiler({ root, target: 'ios' })]).process(
    `${entry}
@source inline(${JSON.stringify(classes)}); ${extra}`,
    { from: `${root}/native-case.css` },
  )

  return result.css
}

function computed(css: string, classes: string[]) {
  registerStylesheet('tailwind-native-candidate', css)
  try {
    const parent: CssHostNode = {
      cssType: 'masonview',
      cssClasses: new Set(['ns-root']),
      props: {},
    }

    const inherited = computeCascade(parent)

    parent.computedStyle = inherited.style
    parent.computedCustomProps = inherited.customProps
    return computeCascade({ cssType: 'masonview', cssClasses: new Set(classes), parent, props: {} })
      .style
  } finally {
    unregisterStylesheet('tailwind-native-candidate')
  }
}

test('native layout utilities reach the existing cascade with logical padding and shared units', async () => {
  const css = await compile('flex absolute w-8 gap-4 px-2 text-sm rounded-lg bg-black')
  const style = computed(css, [
    'flex',
    'absolute',
    'w-8',
    'gap-4',
    'px-2',
    'text-sm',
    'rounded-lg',
    'bg-black',
  ])

  assert.match(css, /@layer utilities/)
  assert.equal(style.display, 'flex')
  assert.equal(style.position, 'absolute')
  assert.equal(style.width, 32)
  assert.equal(style.rowGap, 16)
  assert.equal(style.columnGap, 16)
  assert.equal(style.paddingLeft, 8)
  assert.equal(style.paddingRight, 8)
  assert.equal(style.fontSize, 14)
  assert.equal(style.lineHeight, 20)
  assert.equal(style.borderRadius, 12)
  assert.equal(style.backgroundColor, '#000')
})

test('native output preserves an unlayered authored override and unrelated declarations', async () => {
  const css = await compile(
    'opacity-50',
    '.authored { opacity: .8; accent-color: red; content: "12px" } @layer utilities { .layered-authored { accent-color: green } }',
  )

  const style = computed(css, ['opacity-50', 'authored'])

  assert.equal(style.opacity, 0.8)
  assert.match(css, /accent-color: red/)
  assert.match(css, /content: "12px"/)
  assert.match(css, /accent-color: green/)
})

test('responsive utilities retain inclusive breakpoint semantics', async () => {
  const css = await compile('sm:opacity-50')

  for (const width of [639, 640]) {
    setStyleEnvironment(() => ({ width, height: 800, colorScheme: 'light', reducedMotion: false }))

    const style = computed(css, ['sm:opacity-50'])

    assert.equal(style.opacity, width < 640 ? undefined : 0.5)
  }
})

test('native unsupported features fail instead of silently changing rules', async () => {
  for (const [classes, reason] of [
    ['opacity-50!', /!important/],
    ['translate-x-4', /@property|@supports/],
    ['bg-red-500', /oklch/],
    ['hover:opacity-50', /selector|@media/],
    ['w-[1rem]', /relative unit/],
    ['fixed', /position/],
  ] as const) {
    await assert.rejects(compile(classes), reason, classes)
  }
})

test('arbitrary variables keep identifier text and resolve authored pixel values', async () => {
  const css = await compile('w-[var(--offset-1rem)]', '.ns-root { --offset-1rem: 24px }')

  assert.equal(computed(css, ['w-[var(--offset-1rem)]']).width, 24)
})

test('native unit diagnostics cover physical and container lengths and misplaced grid fractions', async () => {
  for (const classes of ['w-[10pt]', 'w-[10cqw]', 'w-[1fr]']) {
    await assert.rejects(compile(classes), /unit|fraction/, classes)
  }

  const css = await compile('grid grid-cols-[1fr_2fr] w-[50%]', '.authored { width: 10pt }')

  assert.match(css, /grid-template-columns: 1fr 2fr/)
  assert.match(css, /width: 50%/)
  assert.match(css, /width: 10pt/)
})

test('native contextual math fails instead of reaching a rejecting length converter', async () => {
  for (const classes of ['w-[calc(100%_-_8px)]', 'grid-cols-[calc(100%_-_8px)]']) {
    await assert.rejects(compile(classes), /contextual|mixed/)
  }
  const css = await compile(
    'w-[calc(25%*2)] h-[calc(4px*2)]',
    '.authored { width: calc(100% - 8px) }',
  )

  assert.equal(computed(css, ['w-[calc(25%*2)]']).width, '50%')
  assert.equal(computed(css, ['h-[calc(4px*2)]']).height, 8)
  assert.match(css, /width: calc\(100% - 8dip\)/)
})
