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
const icon = compiled(
	'banner-icon',
	'export function Icon(props) @{ <label className={props.className} text={props.name} /> }',
)

const collapsibleContext = compiled(
	'collapsible-context',
	read('collections/collapsible-context.ts'),
	{},
	false,
)

const collapsible = compiled('collapsible', read('collections/Collapsible.tsrx'), {
	'../../internal/layout/style-merge': support,
	'@octane-xplat/lib': support,
	'../overlays/escape-props': support,
	'../actions/Pressable': pressable,
	'./collapsible-context': collapsibleContext,
})

const banner = compiled(
	'banner',
	read('feedback/Banner.windows.tsrx').replace(/^import ['"].*['"]\s*;?$/gm, ''),
	{
		'../../internal/layout/style-merge': support,
		'@octane-xplat/lib': support,
		'../overlays/escape-props': support,
		'../actions/Pressable': pressable,
		'../media/Icon': icon,
		'../forms/text-slot': slot,
		'../collections/Collapsible': collapsible,
	},
)

const { Banner } = await import(banner)

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

const text = (fixture) =>
	fixture
		.nodes()
		.flatMap((node) =>
			node.type === '#text' ? [node.props.value] : node.props.text != null ? [node.props.text] : [],
		)

const buttons = (fixture) => fixture.nodes().filter((node) => node.type === 'xplatwindowsbutton')
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

test('Windows Banner renders and updates its public header, body and presentation props', () => {
	const f = mount(Banner, {
		id: 'notice',
		title: 'Saved',
		description: 'Your changes are ready',
		endContent: 0,
		children: 'More information',
		collapsible: false,
		status: 'success',
		container: 'section',
		elevation: 'low',
		style: { width: 240 },
	})
	try {
		assert.ok(text(f).includes('Saved'))
		assert.ok(text(f).includes('Your changes are ready'))
		assert.ok(text(f).includes('More information'))
		assert.ok(text(f).includes('0'))
		const host = () => f.nodes().find((node) => node.props.id === 'notice')
		assert.equal(host().props.accessibilityLabel, 'Saved')
		assert.equal(host().props.accessibilityLiveRegion, 'polite')
		assert.equal(host().props.style.width, 240)
		assert.match(host().props.className, /vx-banner--success/)
		assert.match(host().props.className, /vx-banner--section/)
		assert.match(host().props.className, /vx-banner--elev-low/)
		assert.equal(buttons(f).length, 0)
		f.render({
			id: 'notice',
			title: 'Failed',
			description: 'Try again',
			status: 'error',
			variant: 'floating',
		})

		assert.ok(text(f).includes('Failed'))
		assert.ok(text(f).includes('Try again'))
		assert.ok(!text(f).includes('Saved'))
		assert.ok(!text(f).includes('More information'))
		assert.equal(host().props.accessibilityLabel, 'Failed')
		assert.equal(host().props.accessibilityLiveRegion, 'assertive')
		assert.match(host().props.className, /vx-banner--floating/)
		assert.doesNotMatch(
			host().props.className,
			/vx-banner--success|vx-banner--section|vx-banner--elev-low/,
		)
	} finally {
		f.root.unmount()
	}
})

test('Windows Banner dismisses once through its current native action and resets on remount', async () => {
	let first = 0
	let latest = 0
	const f = mount(Banner, { title: 'Saved', onDismiss: () => first++ })
	try {
		assert.equal(buttons(f).length, 1)
		assert.equal(buttons(f)[0].props.settings.label, 'Dismiss Saved')
		assert.equal(buttons(f)[0].props.onTap, undefined)
		f.render({ title: 'Updated', onDismiss: () => latest++ })
		assert.equal(buttons(f).length, 1)
		assert.equal(buttons(f)[0].props.settings.label, 'Dismiss Updated')
		const activate = buttons(f)[0].props.settings.onPress
		activate()
		activate()
		await settle()
		assert.equal(first, 0)
		assert.equal(latest, 1)
		assert.equal(f.nodes().length, 0)
	} finally {
		f.root.unmount()
	}
	const remounted = mount(Banner, { title: 'Saved', isDismissable: true })
	try {
		assert.ok(text(remounted).includes('Saved'))
		assert.equal(buttons(remounted).length, 1)
		buttons(remounted)[0].props.settings.onPress()
		await settle()
		assert.equal(remounted.nodes().length, 0)
	} finally {
		remounted.root.unmount()
	}
})

test('Windows Banner details use the real Collapsible and Windows action leaf', async () => {
	const f = mount(Banner, { title: 'Saved', children: 'Details body' })
	try {
		assert.ok(!text(f).includes('Details body'))
		assert.ok(text(f).includes('Details'))
		assert.equal(buttons(f).length, 1)
		assert.equal(buttons(f)[0].props.settings.label, 'Details')
		buttons(f)[0].props.settings.onPress()
		await settle()
		assert.ok(text(f).includes('Details body'))
		buttons(f)[0].props.settings.onPress()
		await settle()
		assert.ok(!text(f).includes('Details body'))
	} finally {
		f.root.unmount()
	}
	const open = mount(Banner, { title: 'Saved', children: 42, collapsible: { defaultIsOpen: true } })
	try {
		assert.ok(text(open).includes('42'))
	} finally {
		open.root.unmount()
	}
})

test('Windows Banner preserves component-valued icon, title, description and action slots', async () => {
	const fixture = compiled(
		'banner-slots',
		`import {Banner} from ${JSON.stringify(banner)};
export function WithSlots(props) @{
  <Banner title={<label text={props.title} />} description={<label text="Composed description" />}
    icon={<label text="Composed icon" />} endContent={<label text="Composed action" />} collapsible={false}>
    {props.children}
  </Banner>
}`,
	)
	const { WithSlots } = await import(fixture)
	const f = mount(WithSlots, { title: 'Composed title', children: 'Composed body' })
	try {
		for (const value of [
			'Composed icon',
			'Composed title',
			'Composed description',
			'Composed action',
			'Composed body',
		]) {
			assert.ok(text(f).includes(value), value)
		}

		f.render({ title: 'Changed title', children: 'Changed body' })
		assert.ok(text(f).includes('Changed title'))
		assert.ok(text(f).includes('Changed body'))
		assert.ok(!text(f).includes('Composed title'))
	} finally {
		f.root.unmount()
	}
})
