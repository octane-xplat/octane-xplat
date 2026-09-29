#!/usr/bin/env node
// Keep the measured parity sample aligned with the shared component exports.
// The platform barrels are the API source of truth; fixture metadata identifies
// what is measured, and the groups below make the current unmeasured surface
// explicit without maintaining a separate coverage document.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import ts from 'typescript'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const ALL_TARGETS = ['web', 'ios', 'android', 'macos']
const REQUIRED_TARGETS = ['web', 'ios', 'android']

// These renderer-file exports are helpers, not component roots. Every other
// runtime export from a renderer file needs fixture coverage or a deferral.
const NON_RENDERABLE = new Map([
	['showToast', 'Imperative toast service; it is an action, not a component root.'],
	['useAnimation', 'Hook that returns animation controls; it does not render a component.'],
	['styled', 'Factory for creating component variants; it is not one fixed component surface.'],
	['useSafeAreaInsets', 'Hook that reads insets; it does not render a component.'],
	['useMeasure', 'Hook that reads layout; it does not render a component.'],
	['useBackInterceptor', 'Hook that registers back behavior; it does not render a component.'],
	['useStore', 'Hook that subscribes to a store; it does not render a component.'],
])

const DEFERRED_GROUPS = [
	{
		reason:
			'RichTextSpan is an inline FormattedString run, not an independent view. The NativeScript bounds/style dump exposes only its containing RichText label, so there is no comparable per-run frame or resolved style.',
		components: ['RichTextSpan'],
	},
]

// A default-state fixture can measure the shared anchor while leaving an
// interaction-only surface unmeasured. Keep those gaps explicit without
// treating the whole component export as uncovered.
const DEFERRED_FACETS = [
	{
		reason:
			'Hoverable and Tooltip fixtures compare only the default anchor/trigger. They do not open or measure the hint layer on pointer targets (web/macOS); iOS and Android intentionally omit that layer.',
		components: ['Hoverable', 'Tooltip'],
	},
]

function parse(path, kind = ts.ScriptKind.TS) {
	return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, kind)
}

function stringValue(node) {
	return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
		? node.text
		: undefined
}

function stringArrayValue(node) {
	if (!ts.isArrayLiteralExpression(node)) {
		return undefined
	}

	const values = node.elements.map(stringValue)
	return values.every((value) => value !== undefined) ? values : undefined
}

function property(object, key) {
	if (!ts.isObjectLiteralExpression(object)) {
		return undefined
	}

	for (const item of object.properties) {
		if (!ts.isPropertyAssignment(item)) {
			continue
		}

		const name =
			ts.isIdentifier(item.name) || ts.isStringLiteral(item.name) ? item.name.text : undefined

		if (name === key) {
			return item.initializer
		}
	}

	return undefined
}

function arrayDeclaration(path, name, kind) {
	const source = parse(path, kind)
	for (const statement of source.statements) {
		if (!ts.isVariableStatement(statement)) {
			continue
		}

		for (const declaration of statement.declarationList.declarations) {
			if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
				if (!declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) {
					throw new Error(`${path}: ${name} must be a literal array`)
				}

				return declaration.initializer.elements
			}
		}
	}

	throw new Error(`${path}: could not find ${name}`)
}

function exportNames(path) {
	const source = parse(path)
	const names = new Set()
	for (const statement of source.statements) {
		if (ts.isExportAssignment(statement)) {
			throw new Error(`${path}: parity coverage needs named exports`)
		}

		if (ts.isExportDeclaration(statement)) {
			if (statement.isTypeOnly) {
				continue
			}

			if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) {
				throw new Error(`${path}: parity coverage needs explicit named exports`)
			}

			for (const item of statement.exportClause.elements) {
				const fromRenderer = /\.(?:tsx|tsrx|jsx)$/.test(
					statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
						? statement.moduleSpecifier.text
						: '',
				)

				if (!item.isTypeOnly && (fromRenderer || /^[A-Z]/.test(item.name.text))) {
					names.add(item.name.text)
				}
			}

			continue
		}

		// Catch locally-declared PascalCase component exports too. Type-only
		// declarations do not reach this branch because interfaces/type aliases
		// are not runtime exports.
		if (
			!ts.canHaveModifiers(statement) ||
			!ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
		) {
			continue
		}

		if (ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
			throw new Error(`${path}: parity coverage needs named exports`)
		}

		if (
			(ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
			statement.name &&
			/^[A-Z]/.test(statement.name.text)
		) {
			names.add(statement.name.text)
		}

		if (ts.isVariableStatement(statement)) {
			for (const declaration of statement.declarationList.declarations) {
				if (ts.isIdentifier(declaration.name) && /^[A-Z]/.test(declaration.name.text)) {
					names.add(declaration.name.text)
				}
			}
		}
	}

	return names
}

function packageEntry(packageRoot, condition) {
	const manifestPath = join(packageRoot, 'package.json')
	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
	const entry = manifest.exports?.['.']?.[condition]
	if (typeof entry !== 'string') {
		throw new Error(`${manifestPath}: expected a string "${condition}" export for "."`)
	}

	return join(packageRoot, entry)
}

const sharedRendererExports = exportNames(join(root, 'packages/ui/src/index.shared.ts'))

for (const pkg of ['pager', 'video']) {
	const packageRoot = join(root, `packages/${pkg}`)
	const web = exportNames(packageEntry(packageRoot, 'web'))
	const native = exportNames(packageEntry(packageRoot, 'native'))
	for (const name of web) {
		if (native.has(name)) {
			sharedRendererExports.add(name)
		}
	}
}

for (const [name, reason] of NON_RENDERABLE) {
	if (!reason.trim()) {
		errors.push(`${name}: non-renderable exports need a reason`)
	}

	if (!sharedRendererExports.has(name)) {
		errors.push(`${name}: stale non-renderable export reason`)
	}
}

const sharedComponents = new Set(
	[...sharedRendererExports].filter((name) => !NON_RENDERABLE.has(name)),
)

const fixturePath = join(root, 'packages/app/src/parity/fixtures.tsrx')
const fixtures = []
for (const element of arrayDeclaration(fixturePath, 'FIXTURES', ts.ScriptKind.TSX)) {
	const name = stringValue(property(element, 'name'))
	const component = stringValue(property(element, 'component'))
	if (!name || !component) {
		errors.push(`${fixturePath}: each fixture needs literal name and component fields`)
		continue
	}

	fixtures.push({ name, component })
}

const checksPath = join(root, 'scripts/parity-checks.mjs')
const checkFixtures = new Set()
const checkTargetsByFixture = new Map()
for (const element of arrayDeclaration(checksPath, 'CHECKS', ts.ScriptKind.JS)) {
	const fixture = stringValue(property(element, 'fixture'))
	if (fixture) {
		if (checkFixtures.has(fixture)) {
			errors.push(`${fixture}: duplicate measured assertion`)
		}

		checkFixtures.add(fixture)
		const targetsNode = property(element, 'targets')
		const targets = targetsNode === undefined ? ALL_TARGETS : stringArrayValue(targetsNode)
		if (
			!targets ||
			targets.length === 0 ||
			targets.some((target) => !ALL_TARGETS.includes(target))
		) {
			errors.push(`${fixture}: targets must be a non-empty list of supported targets`)
			continue
		}

		checkTargetsByFixture.set(fixture, new Set(targets))
	}
}

const fixtureNames = new Set()
const coveredComponents = new Set()
const requiredTargetComponents = new Set()
for (const fixture of fixtures) {
	if (fixtureNames.has(fixture.name)) {
		errors.push(`duplicate fixture name: ${fixture.name}`)
	}

	fixtureNames.add(fixture.name)
	if (!sharedComponents.has(fixture.component)) {
		errors.push(`${fixture.name}: ${fixture.component} is not a shared PascalCase export`)
	}

	coveredComponents.add(fixture.component)
	if (!checkFixtures.has(fixture.name)) {
		errors.push(`${fixture.name}: no measured assertion is registered in ${checksPath}`)
		continue
	}

	const checkTargets = checkTargetsByFixture.get(fixture.name)
	const missingTargets = REQUIRED_TARGETS.filter((target) => !checkTargets?.has(target))
	if (missingTargets.length) {
		errors.push(
			`${fixture.name}: measured assertion must include required targets ${missingTargets.join(', ')}`,
		)
	} else {
		requiredTargetComponents.add(fixture.component)
	}
}

for (const fixture of checkFixtures) {
	if (!fixtureNames.has(fixture)) {
		errors.push(`${fixture}: assertion exists without a fixture in ${fixturePath}`)
	}
}

const deferredComponents = new Set()
for (const group of DEFERRED_GROUPS) {
	if (!group.reason.trim()) {
		errors.push('deferred coverage groups need a reason')
	}

	for (const component of group.components) {
		if (deferredComponents.has(component)) {
			errors.push(`${component}: appears in more than one deferred coverage group`)
		}

		deferredComponents.add(component)
	}
}

const deferredFacetComponents = new Set()
for (const group of DEFERRED_FACETS) {
	if (!group.reason.trim()) {
		errors.push('deferred parity facets need a reason')
	}

	for (const component of group.components) {
		if (deferredFacetComponents.has(component)) {
			errors.push(`${component}: appears in more than one deferred facet group`)
		}

		deferredFacetComponents.add(component)
		if (!coveredComponents.has(component)) {
			errors.push(`${component}: deferred facets require a measured fixture`)
		}
	}
}

for (const component of coveredComponents) {
	if (deferredComponents.has(component)) {
		errors.push(`${component}: has both a fixture and a deferred reason`)
	}
}

for (const component of sharedComponents) {
	if (!coveredComponents.has(component) && !deferredComponents.has(component)) {
		errors.push(`${component}: shared renderable export needs a fixture or deferred reason`)
	}
}

for (const component of [...coveredComponents, ...deferredComponents, ...deferredFacetComponents]) {
	if (!sharedComponents.has(component)) {
		errors.push(`${component}: stale coverage entry is not a shared renderable export`)
	}
}

if (errors.length) {
	console.error(`[parity-coverage] ${errors.length} issue(s):`)
	for (const error of errors) {
		console.error(`  - ${error}`)
	}

	process.exitCode = 1
} else {
	console.log(
		`[parity-coverage] ${coveredComponents.size}/${sharedComponents.size} shared renderable exports have measured checks; web+iOS+Android checks cover ${requiredTargetComponents.size}; ${deferredComponents.size} fully deferred, ${deferredFacetComponents.size} with deferred facets; ${NON_RENDERABLE.size} renderer helpers excluded`,
	)

	const targetLimited = [...coveredComponents]
		.filter((component) => !requiredTargetComponents.has(component))
		.sort((a, b) => a.localeCompare(b))

	if (targetLimited.length) {
		console.log(`[parity-coverage] no web+iOS+Android check: ${targetLimited.join(', ')}`)
	}
}
