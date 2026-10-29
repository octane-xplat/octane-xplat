// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

/** Vendored-copy drift gate: each VENDORED file must stay semantically
 *  identical to its source. Comparison walks the TypeScript AST and ignores
 *  comments (the keep-in-sync header), formatting, and single-statement
 *  block wrappers — per-package lint may brace-wrap bodies differently —
 *  so only real code drift fails. */
const pairs = [
	['packages/image/src/hash-image.ts', 'packages/ui/src/components/media/hash-image.ts'],
	['packages/image/src/image-content.ts', 'packages/ui/src/components/media/image-content.ts'],
	['packages/image/src/prefetch-batch.ts', 'packages/gif/src/prefetch-batch.ts'],
]

const normalize = (text) => {
	const file = ts.createSourceFile('check.ts', text, ts.ScriptTarget.ES2022, true)
	const parts = []
	const visit = (node) => {
		if (ts.isBlock(node) && node.statements.length === 1) {
			visit(node.statements[0])
			return
		}

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

		parts.push(ts.SyntaxKind[node.kind] + (leaf ? `:${node.getText(file)}` : ''))
		ts.forEachChild(node, visit)
	}

	visit(file)
	return parts.join('|')
}

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
