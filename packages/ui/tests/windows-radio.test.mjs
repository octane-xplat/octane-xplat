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
const directory = mkdtempSync(join(tmpdir(), 'xplat-windows-radio-'))
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
export const useMeasure=()=>({ref:()=>{},bounds:{width:300,height:28}});
export const indicatorScope='indicators';
export const useIndicator=()=>null;
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

const indicator = compiled(
	'indicator',
	"export const indicatorScope='indicators'; export function RadioIndicator(props) @{ <indicator state={props.state} /> }",
)

const item = compiled(
	'item',
	readFileSync(new URL('../src/RadioListItem.windows.tsrx', import.meta.url), 'utf8').replace(
		/^import ['"].*['"]\s*;?$/gm,
		'',
	),
	{
		'./escape-props': support,
		'./style-merge': support,
		'./option-list-contexts': contexts,
		'./radio-context.windows': nativeContext,
		'./useMeasure': support,
		'./indicators': indicator,
		'./use-indicator': support,
	},
)

const group = compiled(
	'group',
	readFileSync(new URL('../src/RadioGroup.windows.tsrx', import.meta.url), 'utf8'),
	{
		'./radio-control.windows': support,
		'./radio-context.windows': nativeContext,
		'./RadioListItem.windows': item,
		'./style-merge': support,
		'@octane-xplat/lib': support,
		'./escape-props': support,
		'./field-context': field,
		'./option-list-contexts': contexts,
	},
)

const { RadioGroup } = await import(group)
const { RadioListItem } = await import(item)
const fixtures = compiled(
	'fixtures',
	`import {RadioGroup} from ${JSON.stringify(group)};
import {RadioListItem} from ${JSON.stringify(item)};
import {FieldProvider} from ${JSON.stringify(field)};
export function InField(props) @{
 <FieldProvider value={{label:'Delivery',isDisabled:props.disabled,isReadOnly:props.readOnly}}>
  <RadioGroup defaultValue="a" options={props.options} onValueChange={props.onValueChange} />
 </FieldProvider>
}
export function Children(props) @{
 <RadioGroup value={props.value} onValueChange={props.onValueChange}>
  <RadioListItem value="a" label="Alpha" />
  <RadioListItem value="b" label="Beta" isDisabled={props.disabled} />
 </RadioGroup>
}`,
)

const { InField, Children } = await import(fixtures)
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
function mount(props, component = RadioGroup) {
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
	{ value: 'a', label: 'Alpha' },
	{ value: 'b', label: 'Beta' },
]

test('uncontrolled options retain a seeded default and suppress unchanged requests', async () => {
	const changes = []
	const props = { options, defaultValue: 'a', onValueChange: (value) => changes.push(value) }
	const f = mount(props)
	try {
		await tick()
		const controller = f.inputs()[0].props.settings.group
		assert.equal(controller.selected, 'a')
		controller.requestChange('b')
		await tick()
		assert.equal(controller.selected, 'b')
		controller.requestChange('b')
		f.render({ ...props, defaultValue: 'a' })
		await tick()
		assert.equal(controller.selected, 'b')
		assert.deepEqual(changes, ['b'])
	} finally {
		f.root.unmount()
	}
})

test('controlled child parts share one controller and keep parent ownership', async () => {
	const changes = []
	const props = { value: 'a', onValueChange: (value) => changes.push(value) }
	const f = mount(props, Children)
	try {
		await tick()
		const [a, b] = f.inputs()
		assert.equal(a.props.settings.group, b.props.settings.group)
		const controller = a.props.settings.group
		controller.requestChange('b')
		await tick()
		assert.equal(controller.selected, 'a')
		f.render({ ...props, value: 'b' })
		await tick()
		assert.equal(controller.selected, 'b')
		assert.deepEqual(changes, ['b'])
	} finally {
		f.root.unmount()
	}
})

test('real Field context inherits guards for public options and accessible group name', async () => {
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
			assert.ok(f.nodes().some((node) => node.props.accessibilityLabel === 'Delivery'))
		} finally {
			f.root.unmount()
		}
	}
})

test('standalone item stays presentational without native activation', () => {
	const f = mount({ value: 'a', label: 'Alpha' }, RadioListItem)
	try {
		assert.equal(f.inputs().length, 0)
	} finally {
		f.root.unmount()
	}
})
