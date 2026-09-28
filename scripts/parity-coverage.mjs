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
			'Remaining layout and overlay components need positioning, root-host, or overlay-host scenarios beyond the measured containers.',
		components: [
			'Stack',
			'Absolute',
			'Spacer',
			'ScrollBox',
			'Screen',
			'SafeArea',
			'Overlay',
			'Popover',
			'Sheet',
			'Drawer',
		],
	},
	{
		reason:
			'Text, glyph, or font metrics need box-only assertions that avoid comparing platform font rendering.',
		components: [
			'Text',
			'RichText',
			'RichTextSpan',
			'Badge',
			'Avatar',
			'AvatarGroup',
			'User',
			'Kbd',
			'Link',
			'NavLink',
			'Icon',
			'Heading',
		],
	},
	{
		reason:
			'These controls need representative prop, value, or interaction states beyond the current basic control fixtures.',
		components: [
			'Pressable',
			'Collapsible',
			'Accordion',
			'RadioGroup',
			'DropdownMenu',
			'ContextMenu',
			'FormField',
			'FieldGroup',
			'InputNumber',
			'PinInput',
			'Select',
			'SelectMenu',
			'Combobox',
			'InputMenu',
			'InputTags',
			'InputRating',
			'CheckboxGroup',
			'Stepper',
			'NavigationMenu',
			'CommandPalette',
			'SegmentedControl',
			'Tabs',
			'Meter',
			'ActivityIndicator',
		],
	},
	{
		reason:
			'These simple presentation components have no focused size or style assertion in the initial measured sample.',
		components: ['Separator', 'Skeleton', 'Empty'],
	},
	{
		reason:
			'Content-driven dimensions need representative children or data and an intentional bounds contract; VirtualList also needs viewport and scrolling scenarios.',
		components: [
			'Breadcrumb',
			'Pagination',
			'Table',
			'VirtualList',
			'Timeline',
			'Tree',
			'Alert',
			'Card',
			'Chip',
			'Banner',
			'ProgressGroup',
		],
	},
	{
		reason:
			'OS- or engine-backed content needs target fixtures for the shared frame and any project-drawn chrome.',
		components: [
			'TextInput',
			'TextArea',
			'SearchInput',
			'Pager',
			'Image',
			'WebView',
			'Video',
		],
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

const webExports = exportNames(join(root, 'packages/ui/src/index.web.ts'))
const nativeExports = exportNames(join(root, 'packages/ui/src/index.native.ts'))
const sharedRendererExports = new Set([...webExports].filter((name) => nativeExports.has(name)))
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
for (const element of arrayDeclaration(checksPath, 'CHECKS', ts.ScriptKind.JS)) {
	const fixture = stringValue(property(element, 'fixture'))
	if (fixture) {
		checkFixtures.add(fixture)
	}
}

const fixtureNames = new Set()
const coveredComponents = new Set()
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

for (const component of [...coveredComponents, ...deferredComponents]) {
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
		`[parity-coverage] ${coveredComponents.size}/${sharedComponents.size} shared renderable exports measured; ${deferredComponents.size} deferred; ${NON_RENDERABLE.size} renderer helpers excluded`,
	)
}
