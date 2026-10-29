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
const directory = mkdtempSync(join(tmpdir(), 'xplat-windows-segmented-'))
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
	`import {createContext} from ${JSON.stringify(runtimeUrl)};
export const FormLayoutContext=createContext({defaultOptionality:'optional'});
export const InputGroupContext=createContext(null);
export const SizeContext=createContext('md');
export const cx=(...values)=>values.flat(Infinity).filter(Boolean).join(' ');
export const mergeStyle=(base,style)=>({...base,...style});
export const applyEscapeProps=()=>{};
export const nativeAccessibilityState=value=>value;
export const useMeasure=()=>({ref:()=>{},bounds:{width:96,height:28}});
export class WindowsRadioGroup {
 update(selected, disabled, readOnly, requestChange) {Object.assign(this,{selected,disabled,readOnly,requestChange});}
 restore() {} cancelFocusReset() {}
}`,
)

const field = compiled(
	'field',
	readFileSync(new URL('../src/field-context.ts', import.meta.url), 'utf8'),
	{
		'./form-layout-context': support,
		'./input-group-context': support,
		'./size-context': support,
	},
	false,
)

const contexts = compiled(
	'contexts',
	readFileSync(new URL('../src/option-list-contexts.ts', import.meta.url), 'utf8'),
	{},
	false,
)

const nativeContext = compiled(
	'native-context',
	readFileSync(new URL('../src/radio-context.windows.ts', import.meta.url), 'utf8'),
	{},
	false,
)

const item = compiled(
	'item',
	readFileSync(
		new URL('../src/SegmentedControlItem.windows.tsrx', import.meta.url),
		'utf8',
	).replace(/^import ['"].*['"]\s*;?$/gm, ''),
	{
		'./escape-props': support,
		'./style-merge': support,
		'./option-list-contexts': contexts,
		'./radio-context.windows': nativeContext,
		'./useMeasure': support,
	},
)

const control = compiled(
	'control',
	readFileSync(new URL('../src/SegmentedControl.windows.tsrx', import.meta.url), 'utf8'),
	{
		'./radio-control.windows': support,
		'./radio-context.windows': nativeContext,
		'./SegmentedControlItem.windows': item,
		'./style-merge': support,
		'@octane-xplat/lib': support,
		'./escape-props': support,
		'./field-context': field,
		'./option-list-contexts': contexts,
	},
)

const { SegmentedControl } = await import(control)
const { SegmentedControlItem } = await import(item)
const fixtures = compiled(
	'fixtures',
	`import {SegmentedControl} from ${JSON.stringify(control)};
import {SegmentedControlItem} from ${JSON.stringify(item)};
import {FieldProvider} from ${JSON.stringify(field)};
export function InField(props) @{
 <FieldProvider value={{label:'View',isDisabled:props.disabled,isReadOnly:props.readOnly}}>
  <SegmentedControl defaultValue="a" options={props.options} onValueChange={props.onValueChange} />
 </FieldProvider>
}
export function Children(props) @{
 <SegmentedControl value={props.value} onValueChange={props.onValueChange}>
  <SegmentedControlItem value="a" label="List" />
  <SegmentedControlItem value="b" label="Grid" isLabelHidden icon={<icon />} />
  <SegmentedControlItem value="c" label="Board" isDisabled={props.disabled} />
 </SegmentedControl>
}`,
)

const { InField, Children } = await import(fixtures)
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
function mount(props, component = SegmentedControl) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const nodes = () => {
		const visit = (children) => children.flatMap((node) => [node, ...visit(node.children ?? [])])
		return visit(container.children)
	}
	root.render(component, props)
	return {
		root,
		nodes,
		inputs: () => nodes().filter((node) => node.type === 'xplatwindowsradio'),
		render: (next) => root.render(component, next),
	}
}

const options = [
	{ value: 'a', label: 'Day' },
	{ value: 'b', label: 'Week' },
	{ value: 'c', label: 'Month', isDisabled: true },
]

test('uncontrolled options share one peer group, seed the default and suppress unchanged requests', async () => {
	const changes = []
	const props = { options, defaultValue: 'a', onValueChange: (value) => changes.push(value) }
	const f = mount(props)
	try {
		await tick()
		const inputs = f.inputs()
		assert.deepEqual(
			inputs.map((input) => [
				input.props.settings.value,
				input.props.accessibilityLabel,
				input.props.isEnabled,
			]),
			[
				['a', 'Day', true],
				['b', 'Week', true],
				['c', 'Month', false],
			],
		)

		const controller = inputs[0].props.settings.group
		assert.ok(inputs.every((input) => input.props.settings.group === controller))
		assert.equal(controller.selected, 'a')
		controller.requestChange('b')
		await tick()
		assert.equal(controller.selected, 'b')
		controller.requestChange('b')
		f.render({ ...props, defaultValue: 'a' })
		await tick()
		assert.equal(controller.selected, 'b')
		assert.deepEqual(changes, ['b'])
		const classes = (node) =>
			[node.props.className].flat(Infinity).filter(Boolean).join(' ').split(' ')

		const on = f.nodes().filter((node) => classes(node).includes('vx-segment--on'))
		assert.equal(on.length, 1)
		assert.ok(on[0].children.some((child) => child.props?.text === 'Week'))
	} finally {
		f.root.unmount()
	}
})

test('controlled child segments keep parent ownership and name icon-only peers', async () => {
	const changes = []
	const props = { value: 'a', onValueChange: (value) => changes.push(value) }
	const f = mount(props, Children)
	try {
		await tick()
		const [a, b, c] = f.inputs()
		const controller = a.props.settings.group
		assert.equal(b.props.settings.group, controller)
		assert.equal(b.props.accessibilityLabel, 'Grid')
		assert.ok(!f.nodes().some((node) => node.type === 'label' && node.props.text === 'Grid'))
		assert.equal(c.props.isEnabled, true)
		controller.requestChange('b')
		await tick()
		assert.equal(controller.selected, 'a')
		f.render({ ...props, value: 'b' })
		await tick()
		assert.equal(controller.selected, 'b')
		f.render({ ...props, value: 'b', disabled: true })
		await tick()
		assert.equal(f.inputs()[2].props.isEnabled, false)
		assert.deepEqual(changes, ['b'])
	} finally {
		f.root.unmount()
	}
})

test('real Field context inherits guards and names the segmented group', async () => {
	for (const flags of [{ disabled: true }, { readOnly: true }]) {
		const changes = []
		const f = mount({ ...flags, options, onValueChange: (value) => changes.push(value) }, InField)
		try {
			await tick()
			const input = f.inputs()[0]
			const controller = input.props.settings.group
			assert.equal(controller.disabled, !!flags.disabled)
			assert.equal(controller.readOnly, !!flags.readOnly)
			assert.equal(input.props.isEnabled, !flags.disabled)
			controller.requestChange('b')
			assert.deepEqual(changes, [])
			assert.ok(f.nodes().some((node) => node.props.accessibilityLabel === 'View'))
		} finally {
			f.root.unmount()
		}
	}
})

test('standalone segment stays presentational without native activation', () => {
	const f = mount({ value: 'a', label: 'List' }, SegmentedControlItem)
	try {
		assert.equal(f.inputs().length, 0)
		assert.ok(f.nodes().some((node) => node.type === 'label' && node.props.text === 'List'))
	} finally {
		f.root.unmount()
	}
})
