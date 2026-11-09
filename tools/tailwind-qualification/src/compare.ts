import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'
// This Node-only comparison loads the adapter's PostCSS compiler, not a native UI module.
// oxlint-disable-next-line xplat/no-nativescript-import
import nativeAdapter from '@nativescript/tailwind'
import { fileURLToPath } from 'node:url'

export interface Scenario {
  name: string
  css: string
  markup: string
  selector: string
  property: string
  expected: string
}

// These cases isolate adaptation semantics. The browser is an oracle for CSS
// before/after rewriting, not a substitute for a native renderer.
export const scenarios: Scenario[] = [
  {
    name: 'unlayered app override beats a more specific layered rule',
    css: '@layer utilities { .a.b { opacity: .25 } } .b { opacity: .75 }',
    markup: '<div class="a b"></div>',
    selector: '.b',
    property: 'opacity',
    expected: '0.75',
  },
  {
    name: 'important declarations reverse named layer order',
    css: '@layer first, last; @layer first { .a { opacity: .25 !important } } @layer last { .a { opacity: .75 !important } }',
    markup: '<div class="a"></div>',
    selector: '.a',
    property: 'opacity',
    expected: '0.25',
  },
  {
    name: 'false supports gate stays false',
    css: '.a { opacity: .25 } @supports (display: xplat-invalid-value) { .a { opacity: .75 } }',
    markup: '<div class="a"></div>',
    selector: '.a',
    property: 'opacity',
    expected: '0.25',
  },
  {
    name: 'registered non-inheriting variable resets on descendants',
    css: '@property --probe-opacity { syntax: "<number>"; inherits: false; initial-value: 1 } .parent { --probe-opacity: .25 } .child { opacity: var(--probe-opacity) }',
    markup: '<div class="parent"><div class="child"></div></div>',
    selector: '.child',
    property: 'opacity',
    expected: '1',
  },
  {
    name: 'invisible retains visibility hidden',
    css: '.a { visibility: hidden; height: 32px }',
    markup: '<div class="a"></div>',
    selector: '.a',
    property: 'visibility',
    expected: 'hidden',
  },
  {
    name: 'supported media query remains effective',
    css: '.a { opacity: .25 } @media (min-width: 600px) { .a { opacity: .75 } }',
    markup: '<div class="a"></div>',
    selector: '.a',
    property: 'opacity',
    expected: '0.75',
  },
]

export async function adapt(css: string, from = 'qualification.css') {
  const result = await postcss([nativeAdapter]).process(css, { from, map: false })
  return { css: result.css, warnings: result.warnings().map((warning) => warning.toString()) }
}

export async function compileTailwind() {
  const source = `
@layer theme, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities) source(none);
@source inline("flex grid absolute gap-4 p-4 px-4 w-32 max-w-32 min-w-0 flex-1 items-center bg-red-500 text-sm rounded-lg invisible translate-x-4 scale-50 sm:opacity-50 dark:opacity-50 opacity-50!");
`
  const started = performance.now()
  const result = await postcss([tailwindcss({ optimize: true })]).process(source, {
    from: fileURLToPath(new URL('./corpus.css', import.meta.url)),
    map: false,
  })
  return { css: result.css, durationMs: performance.now() - started }
}

export function declarations(css: string, selector: string) {
  const found: string[] = []
  postcss.parse(css).walkRules((rule) => {
    if (rule.selector === selector) {
      rule.walkDecls((decl) => {
        found.push(`${decl.prop}:${decl.value}${decl.important ? '!important' : ''}`)
      })
    }
  })
  return found
}
