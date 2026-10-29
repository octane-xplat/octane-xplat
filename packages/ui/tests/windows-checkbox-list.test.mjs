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
const directory = mkdtempSync(join(tmpdir(), 'xplat-windows-checkbox-list-'))
after(() => rmSync(directory, { recursive: true, force: true }))

function moduleFile(name, code) {
	const path = join(directory, name + '.mjs')
	writeFileSync(path, code)
	return pathToFileURL(path).href
}

function compiled(name, source, imports = {}) {
	let code = compile(source, name + '.tsrx', {
		renderer: {
			id: 'nativescript',
			module: runtimeUrl,
			target: 'universal',
			server: 'unsupported',
			text: 'host',
		},
	}).code
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

// Only host drawing/measurement is stubbed. The compiler, runtime, state and
// provider/consumer updates are real. OS input and WinUI layout need native checks.
const support = moduleFile(
	'support',
	`import {createContext} from ${JSON.stringify(runtimeUrl)};
export const CheckboxListContext=createContext(null);
export const CheckboxListProvider=CheckboxListContext;
export const useFieldControlProps=props=>({...props,size:props.size??'md'});
export const applyEscapeProps=()=>{};
export const nativeAccessibilityState=state=>state?.disabled?'disabled':undefined;
export const cx=(...values)=>values.flat(Infinity).filter(Boolean).join(' ');
export const mergeStyle=(base,style)=>({...base,...style});
export const useIndicator=()=>null;
export const useMeasure=()=>({ref:()=>{},bounds:{width:100,height:24}});
export const indicatorScope='vx-indicator-scope';`,
)

const visuals = compiled(
	'visuals',
	`export function CheckboxIndicator(props) @{
 <indicator state={props.state} size={props.size} />
}
export function Checkbox(props) @{
 <xplatwindowscheckbox checked={props.value??props.defaultValue??false}
  isEnabled={!props.isDisabled} readOnly={props.isReadOnly??false}
  accessibilityLabel={props.accessibilityLabel??props.label}
  requestChange={props.onChange} size={props.size} />
}`,
)

const imports = Object.fromEntries(
	[
		'@octane-xplat/lib',
		'./escape-props',
		'./field-context',
		'./option-list-contexts',
		'./style-merge',
		'./use-indicator',
		'./useMeasure',
	].map((name) => [name, support]),
)

const indicators = moduleFile(
	'indicators',
	`export {CheckboxIndicator} from ${JSON.stringify(visuals)};
export {indicatorScope} from ${JSON.stringify(support)};`,
)

const groupUrl = compiled(
	'group',
	readFileSync(new URL('../src/CheckboxGroup.windows.tsrx', import.meta.url), 'utf8'),
	{ ...imports, './Checkbox': visuals },
)

const itemUrl = compiled(
	'item',
	readFileSync(new URL('../src/CheckboxListItem.windows.tsrx', import.meta.url), 'utf8').replace(
		/^import ['"]\.\/(?:checkbox-control|Checkbox\.windows\.css)['"]\s*;?$/gm,
		'',
	),
	{ ...imports, './indicators': indicators },
)

const fixturesUrl = compiled(
	'fixtures',
	`import {useState} from 'octane';
import {CheckboxGroup} from ${JSON.stringify(groupUrl)};
import {CheckboxListItem} from ${JSON.stringify(itemUrl)};
export function Items(props) @{
 <CheckboxGroup value={props.value} defaultValue={props.defaultValue}
  options={props.options} onValueChange={props.onValueChange}
  density={props.density} isReadOnly={props.isReadOnly} isDisabled={props.isDisabled}>
  <CheckboxListItem value="alpha" label="Child Alpha" description="Details"
   endContent={<label text="End" />} />
  <CheckboxListItem value="bravo" label="Child Bravo" isDisabled={props.optionDisabled} />
  <CheckboxListItem label="All" isChecked={props.allState??false} onCheck={props.onCheck} />
 </CheckboxGroup>
}
export function SelectAll(props) @{
 const [selected,setSelected]=useState(['alpha']);
 const all=selected.includes('alpha')&&selected.includes('bravo');
 <CheckboxGroup value={selected} onValueChange={next=>{props.onValueChange(next);setSelected(next)}}>
  <CheckboxListItem label="All" isChecked={all?true:selected.length?'indeterminate':false}
   onCheck={next=>{props.onCheck(next);setSelected(next?['alpha','bravo']:[])}} />
  <CheckboxListItem value="alpha" label="Child Alpha" />
  <CheckboxListItem value="bravo" label="Child Bravo" />
 </CheckboxGroup>
}`,
)

const { CheckboxGroup } = await import(groupUrl)
const { CheckboxListItem } = await import(itemUrl)
const { Items, SelectAll } = await import(fixturesUrl)
const tick = () => new Promise((resolve) => setImmediate(resolve))

function mount(component, props) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(component, props)
	const nodes = () => {
		const visit = (children) => children.flatMap((node) => [node, ...visit(node.children ?? [])])
		return visit(container.children)
	}
	const input = (name) => {
		const found = nodes().find(
			(node) => node.type === 'xplatwindowscheckbox' && node.props.accessibilityLabel === name,
		)
		assert.ok(found, 'Missing input: ' + name)
		return found
	}
	return { root, nodes, input, render: (props) => root.render(component, props) }
}

const options = [
	{ value: 'alpha', label: 'Alpha' },
	{ value: 'bravo', label: 'Bravo' },
]

test('uncontrolled options seed once and update membership without duplicate requests', async () => {
	const changes = []
	const props = { options, defaultValue: ['bravo'], onValueChange: (value) => changes.push(value) }
	const f = mount(CheckboxGroup, props)
	try {
		assert.equal(f.input('Alpha').props.checked, false)
		assert.equal(f.input('Bravo').props.checked, true)
		f.input('Alpha').props.requestChange(true)
		await tick()
		assert.deepEqual(changes, [['bravo', 'alpha']])
		assert.equal(f.input('Alpha').props.checked, true)
		f.input('Alpha').props.requestChange(true)
		await tick()
		assert.equal(changes.length, 1)
		f.render({ ...props, defaultValue: [] })
		assert.equal(f.input('Alpha').props.checked, true)
		f.input('Bravo').props.requestChange(false)
		await tick()
		assert.deepEqual(changes[1], ['alpha'])
	} finally {
		f.root.unmount()
	}
})

test('controlled values override defaults and rejected requests stay caller-owned', async () => {
	const changes = []
	const value = ['bravo']
	const props = { options, value, defaultValue: ['alpha'], onValueChange: (v) => changes.push(v) }
	const f = mount(CheckboxGroup, props)
	try {
		assert.equal(f.input('Alpha').props.checked, false)
		f.input('Alpha').props.requestChange(true)
		await tick()
		assert.deepEqual(changes, [['bravo', 'alpha']])
		assert.deepEqual(value, ['bravo'])
		assert.equal(f.input('Alpha').props.checked, false)
		f.render({ ...props, value: changes[0] })
		assert.equal(f.input('Alpha').props.checked, true)
	} finally {
		f.root.unmount()
	}
})

test('compact option controls receive small size, disabled state and a key-only accessible name', () => {
	const f = mount(CheckboxGroup, {
		options: [{ value: 'Key only' }, { value: 'blocked', label: 'Blocked', isDisabled: true }],
		density: 'compact',
		size: 'lg',
	})
	try {
		assert.equal(f.input('Key only').props.size, 'sm')
		assert.equal(f.input('Blocked').props.isEnabled, false)
	} finally {
		f.root.unmount()
	}
})

for (const guard of ['isDisabled', 'isReadOnly']) {
	test(`group ${guard} blocks membership callbacks and can be cleared`, async () => {
		const changes = []
		const props = { options, [guard]: true, onValueChange: (v) => changes.push(v) }
		const f = mount(CheckboxGroup, props)
		try {
			f.input('Alpha').props.requestChange(true)
			await tick()
			assert.deepEqual(changes, [])
			f.render({ ...props, [guard]: false })
			f.input('Alpha').props.requestChange(true)
			await tick()
			assert.deepEqual(changes, [['alpha']])
		} finally {
			f.root.unmount()
		}
	})
}

test('provider updates reach unchanged child items, indicator state and string class names', async () => {
	const changes = []
	const props = { value: ['alpha'], density: 'compact', onValueChange: (v) => changes.push(v) }
	const f = mount(Items, props)
	try {
		assert.equal(f.input('Child Alpha').props.checked, true)
		assert.equal(f.input('Child Bravo').props.checked, false)
		f.input('Child Bravo').props.requestChange(true)
		await tick()
		assert.deepEqual(changes, [['alpha', 'bravo']])
		f.render({ ...props, value: ['bravo'] })
		assert.equal(f.input('Child Alpha').props.checked, false)
		assert.equal(f.input('Child Bravo').props.checked, true)
		assert.ok(f.nodes().some((n) => n.type === 'indicator' && n.props.size === 'sm'))
		const rows = f.nodes().filter((n) => n.props.className?.includes('vx-checkboxlist-item'))
		assert.equal(rows.length, 3)
		assert.ok(rows.every((row) => typeof row.props.className === 'string'))
		assert.ok(f.nodes().some((n) => n.type === 'label' && n.props.text === 'End'))
	} finally {
		f.root.unmount()
	}
})

test('standalone select-all items keep their callback separate and inherit group guards', async () => {
	const changes = []
	const checks = []
	const props = {
		value: ['alpha'],
		allState: 'indeterminate',
		onValueChange: (v) => changes.push(v),
		onCheck: (v) => checks.push(v),
	}
	const f = mount(Items, props)
	try {
		assert.equal(f.input('All').props.checked, 'indeterminate')
		f.input('All').props.requestChange(true)
		await tick()
		assert.deepEqual(checks, [true])
		assert.deepEqual(changes, [])
		f.render({ ...props, isReadOnly: true })
		assert.equal(f.input('All').props.readOnly, true)
		f.input('All').props.requestChange(true)
		await tick()
		assert.deepEqual(checks, [true])
		f.render({ ...props, isDisabled: true })
		assert.equal(f.input('All').props.isEnabled, false)
	} finally {
		f.root.unmount()
	}
})

test('select-all changes update context consumers and return the standalone item to mixed', async () => {
	const changes = []
	const checks = []
	const f = mount(SelectAll, {
		onValueChange: (v) => changes.push(v),
		onCheck: (v) => checks.push(v),
	})
	try {
		assert.equal(f.input('All').props.checked, 'indeterminate')
		f.input('All').props.requestChange(true)
		await tick()
		assert.deepEqual(checks, [true])
		assert.equal(f.input('Child Bravo').props.checked, true)
		assert.equal(f.input('All').props.checked, true)
		f.input('Child Alpha').props.requestChange(false)
		await tick()
		assert.deepEqual(changes, [['bravo']])
		assert.equal(f.input('All').props.checked, 'indeterminate')
	} finally {
		f.root.unmount()
	}
})

test('options and child items share the current controlled array and updated callback', async () => {
	const first = []
	const second = []
	const props = {
		options: [{ value: 'option', label: 'Option' }],
		value: ['option'],
		onValueChange: (v) => first.push(v),
	}
	const f = mount(Items, props)
	try {
		f.input('Child Bravo').props.requestChange(true)
		await tick()
		assert.deepEqual(first, [['option', 'bravo']])
		f.render({ ...props, value: first[0], onValueChange: (v) => second.push(v) })
		f.input('Option').props.requestChange(false)
		await tick()
		assert.deepEqual(second, [['bravo']])
		assert.equal(first.length, 1)
	} finally {
		f.root.unmount()
	}
})

test('keyed option reorder preserves membership and remount restores defaults', async () => {
	const props = { options, defaultValue: ['alpha'] }
	const f = mount(CheckboxGroup, props)
	try {
		f.input('Bravo').props.requestChange(true)
		await tick()
		f.render({ ...props, options: [...options].reverse() })
		assert.equal(f.input('Alpha').props.checked, true)
		assert.equal(f.input('Bravo').props.checked, true)
	} finally {
		f.root.unmount()
	}
	const replacement = mount(CheckboxGroup, props)
	try {
		assert.equal(replacement.input('Bravo').props.checked, false)
	} finally {
		replacement.root.unmount()
	}
	const standalone = mount(CheckboxListItem, { label: 'Outside', isChecked: 'indeterminate' })
	try {
		assert.equal(standalone.input('Outside').props.checked, 'indeterminate')
		assert.equal(standalone.input('Outside').props.readOnly, false)
	} finally {
		standalone.root.unmount()
	}
})
