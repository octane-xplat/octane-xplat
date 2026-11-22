// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- Load ambient css-tree types without importing a declaration file at runtime.
/// <reference path="./vendor/css-tree.d.ts" />
import { parse, walk } from 'css-tree'

/** Use logical lengths in declarations fed to NativeScript's stylesheet parser. */
export function normalizeStylesheetPixels(css: string): string {
  if (!/px\b/i.test(css)) {
    return css
  }

  const ast = parse(css, { positions: true, parseCustomProperty: true })
  const unitEnds: number[] = []
  walk(ast, {
    visit: 'Declaration',
    enter(declaration) {
      walk(declaration.value, {
        visit: 'Dimension',
        enter(dimension) {
          if (dimension.unit?.toLowerCase() === 'px' && dimension.loc) {
            unitEnds.push(dimension.loc.end.offset)
          }
        },
      })
    },
  })

  // Preserve the original text, including selectors, query preludes and URLs.
  let end = css.length
  const parts: string[] = []
  for (const unitEnd of unitEnds.reverse()) {
    parts.push('dip' + css.slice(unitEnd, end))
    end = unitEnd - 2
  }
  parts.push(css.slice(0, end))
  return parts.reverse().join('')
}
