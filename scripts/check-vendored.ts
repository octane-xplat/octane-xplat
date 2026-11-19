// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { readFile } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript-classic'

/** Vendored-copy drift gate: each VENDORED file must stay semantically
 *  identical to its source. Comparison walks the TypeScript AST and ignores
 *  comments (the keep-in-sync header), formatting, relative import depth
 *  (a copy rewrites `../../` specifiers for its own package layout), and
 *  single-statement block wrappers — per-package lint may brace-wrap bodies
 *  differently — so only real code drift fails. */
const pairs = [
  ['packages/image/src/hash-image.ts', 'packages/ui/src/components/media/hash-image.ts'],
  ['packages/image/src/image-content.ts', 'packages/ui/src/components/media/image-content.ts'],
  ['packages/image/src/prefetch-batch.ts', 'packages/gif/src/prefetch-batch.ts'],
]

export const normalize = (text) => {
  const file = ts.createSourceFile('check.ts', text, ts.ScriptTarget.ES2022, true)
  const parts = []
  const visit = (node) => {
    if (ts.isBlock(node) && node.statements.length === 1) {
      visit(node.statements[0])
      return
    }

    // A copy adjusts relative specifier depth for its own package root —
    // compare the imported name, not the number of `..` segments. Bare
    // specifiers keep their literal text: `octane` -> `other` is real drift.
    const moduleSpecifier =
      node.parent &&
      (ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent)) &&
      node.parent.moduleSpecifier === node &&
      ts.isStringLiteralLike(node) &&
      node.text.startsWith('.')

    const text_ = moduleSpecifier ? node.text.split('/').pop() : node.getText(file)

    // Leaf values matter: an identifier rename or literal change is real
    // drift even when the node kinds match.
    const leaf =
      ts.isIdentifier(node) ||
      ts.isNumericLiteral(node) ||
      ts.isStringLiteral(node) ||
      node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
      node.kind === ts.SyntaxKind.TemplateHead ||
      node.kind === ts.SyntaxKind.TemplateMiddle ||
      node.kind === ts.SyntaxKind.TemplateTail

    parts.push(ts.SyntaxKind[node.kind] + (leaf ? `:${text_}` : ''))
    ts.forEachChild(node, visit)
  }

  visit(file)
  return parts.join('|')
}

const main = async () => {
  let failed = false

  for (const [copy, source] of pairs) {
    if (normalize(await readFile(copy, 'utf8')) === normalize(await readFile(source, 'utf8'))) {
      console.log(`vendored copy in sync: ${copy}`)
      continue
    }

    failed = true
    console.error(`VENDORED drift: ${copy} differs from ${source}`)
  }

  if (failed) {
    console.error('check-vendored: vendored copies drifted from their sources')
    process.exit(1)
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
