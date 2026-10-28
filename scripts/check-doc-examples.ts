import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSync, type Language } from '@tsrx/oxc/parser'
import ts from 'typescript'
import { parseAllDocuments } from 'yaml'
import { checkDocumentation, markdownParts, type Fence } from './check-docs.ts'

const languages = new Map<string, Language>([
	['ts', 'ts'],
	['typescript', 'ts'],
	['tsx', 'tsx'],
	['tsrx', 'tsrx'],
	['js', 'js'],
	['javascript', 'js'],
	['jsx', 'jsx'],
])

/** Syntax only: fragments may deliberately depend on the preceding example. */
export function exampleErrors(fence: Fence): string[] {
	const language = languages.get(fence.language)
	if (language) {
		return parseSync(`example.${language}`, fence.code, {
			lang: language,
			showSemanticErrors: false,
		})
			.errors.filter((error) => error.severity === 'Error')
			.map((error) => error.message)
	}
	if (fence.language === 'json') {
		try {
			JSON.parse(fence.code)
			return []
		} catch (error) {
			return [String(error)]
		}
	}
	if (fence.language === 'jsonc') {
		return ts.parseConfigFileTextToJson('example.json', fence.code).error
			? ['Invalid JSON with comments']
			: []
	}
	if (fence.language === 'yaml' || fence.language === 'yml') {
		return parseAllDocuments(fence.code).flatMap((doc) => doc.errors.map((error) => error.message))
	}
	return []
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const root = fileURLToPath(new URL('../', import.meta.url))
	const { inventory } = checkDocumentation(root)
	const errors: string[] = []
	let checked = 0
	for (const page of inventory) {
		const { fences } = markdownParts(readFileSync(resolve(root, page.path), 'utf8'))
		for (const fence of fences) {
			if (
				!languages.has(fence.language) &&
				!['json', 'jsonc', 'yaml', 'yml'].includes(fence.language)
			) {
				continue
			}
			checked++
			for (const error of exampleErrors(fence)) {
				errors.push(`${page.path}:${fence.line}: ${error}`)
			}
		}
	}
	if (errors.length) {
		console.error(errors.join('\n'))
		process.exitCode = 1
	} else {
		console.log(
			`${checked} code examples parse. Imports, types, setup, and runtime results require separate verification.`,
		)
	}
}
