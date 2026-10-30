import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const runtimeUrl = pathToFileURL(require.resolve('octane/universal/native')).href
const { compile } = await import(pathToFileURL(require.resolve('octane/compiler')))
const { createObjectContainer, createObjectDriver, createUniversalRoot } = await import(runtimeUrl)
const directory = mkdtempSync(join(tmpdir(), 'xplat-windows-pressable-'))
after(() => rmSync(directory, { recursive: true, force: true }))

function moduleFile(name, code) {
	const path = join(directory, name + '.mjs')
	writeFileSync(path, code)
	return pathToFileURL(path).href
}

function compiled(name, source, imports = {}, template = true) {
	let code = template
		? compile(source, name + '.tsrx', {
				renderer: {
					id: 'nativescript',
					module: runtimeUrl,
					target: 'universal',
					server: 'unsupported',
					text: 'host',
				},
			}).code
		: source
	code = code.replace(/from\s*(['"])([^'"]+)\1/g, (match, quote, specifier) => {
		const target = specifier === 'octane' ? runtimeUrl : imports[specifier]
		return target ? 'from ' + JSON.stringify(target) : match
	})
	return moduleFile(
		name,
		ts.transpileModule(code, {
			compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
		}).outputText,
	)
}

const support = moduleFile(
	'support',
	`
import {Children} from ${JSON.stringify(runtimeUrl)};
export const cx=(...values)=>values.flat(Infinity).filter(Boolean).join(' ');
export const mergeStyle=(base,style)=>({...base,...style});
export const styleRecord=style=>style??{};
export const refList=(...refs)=>refs.filter(Boolean);
export const applyEscapeProps=()=>{};
export const nativeAccessibilityRole=value=>value;
export const nativeAccessibilityState=value=>value?.disabled?'disabled':undefined;
export const useMeasure=()=>({ref:()=>{},bounds:{width:120,height:32}});
export const usePan=value=>value;
export const layoutChildProps=(props,style)=>({style});
export const useLinkComponent=value=>value??'a';
export const Utils={openUrl:()=>true};
export const toChildArray=Children.toArray;
export const mapChildren=Children.map;
`,
)

const read = (name) => readFileSync(new URL('../src/components/' + name, import.meta.url), 'utf8')
const pressable = compiled(
	'pressable',
	read('actions/Pressable.windows.tsrx').replace(/^import ['"].*['"]\s*;?$/gm, ''),
	{
		'../../internal/layout/style-merge': support,
		'../../internal/accessibility/ref-list': support,
		'@octane-xplat/lib': support,
		'../overlays/escape-props': support,
		'../layout/layout-child': support,
		'../layout/useMeasure': support,
		'../layout/pan': support,
	},
)

const slot = compiled('text-slot', read('forms/text-slot.tsrx'), {
	'../../internal/rendering/child-array': support,
})

const link = compiled('link', read('navigation/Link.windows.tsrx'), {
	'../../internal/layout/style-merge': support,
	'@nativescript/core': support,
	'../actions/Pressable': pressable,
	'../forms/text-slot': slot,
	'./use-link-component.tsrx': support,
})

const { Pressable } = await import(pressable)
const { Link } = await import(link)
function mount(component, props) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const nodes = () => {
		const visit = (children) => children.flatMap((node) => [node, ...visit(node.children ?? [])])
		return visit(container.children)
	}
	root.render(component, props)
	return { root, nodes, render: (props) => root.render(component, props) }
}

test('Windows Pressable mounts a native host and updates its peer kind and callback', () => {
	const first = () => {}
	const next = () => {}
	const f = mount(Pressable, { accessibilityLabel: 'First', onPress: first })
	try {
		const inputs = () =>
			f.nodes().filter((n) => n.type === 'xplatwindowsbutton' || n.type === 'xplatwindowslink')

		assert.equal(inputs().length, 1)
		assert.equal(inputs()[0].type, 'xplatwindowsbutton')
		assert.equal(inputs()[0].props.settings.onPress, first)
		assert.equal(inputs()[0].props.settings.label, 'First')
		assert.equal(inputs()[0].props.style.width, 120)
		assert.equal(inputs()[0].props.style.height, 32)
		assert.equal(inputs()[0].props.onTap, undefined)
		f.render({
			accessibilityLabel: 'Next',
			accessibilityRole: 'link',
			onPress: next,
			disabled: true,
		})

		assert.equal(inputs().length, 1)
		assert.equal(inputs()[0].type, 'xplatwindowslink')
		assert.equal(inputs()[0].props.settings.onPress, next)
		assert.equal(inputs()[0].props.isEnabled, false)
		assert.equal(inputs()[0].props.settings.label, 'Next')
	} finally {
		f.root.unmount()
	}
})

test('Windows Link gives primitive children a text host inside its hyperlink peer', () => {
	const f = mount(Link, { href: 'https://example.com', children: 'Details' })
	try {
		assert.equal(f.nodes().filter((n) => n.type === 'xplatwindowslink').length, 1)
		assert.equal(f.nodes().filter((n) => n.type === 'label').length, 1)
		assert.ok(
			f.nodes().some((n) => n.type === '#text' && n.props.value === 'Details'),
			JSON.stringify(f.nodes()),
		)
	} finally {
		f.root.unmount()
	}
})
