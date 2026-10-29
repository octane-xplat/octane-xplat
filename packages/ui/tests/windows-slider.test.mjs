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
const directory = mkdtempSync(join(tmpdir(), 'xplat-windows-slider-'))
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

// Real compiler/runtime and field-context resolution; only drawing, geometry and OS events are stubbed.
const support = moduleFile(
	'support',
	`import {createContext} from ${JSON.stringify(runtimeUrl)};
export const FormLayoutContext=createContext({defaultOptionality:'optional'});
export const InputGroupContext=createContext(null);
export const SizeContext=createContext('md');
export const cx=(...values)=>values.flat(Infinity).filter(Boolean).join(' ');
export const mergeStyle=(base,style)=>({...base,...style});
export const applyEscapeProps=()=>{};
export const focused=[];
export const focusSliderInput=view=>{focused.push(view);return view!=null;};
export const queueSliderInputFocus=()=>()=>{};
export const useMeasure=()=>({ref:()=>{},bounds:{width:300,height:28}});
export const usePan=callback=>callback;`,
)

const field = compiled(
	'field',
	readFileSync(new URL('../src/components/forms/field-context.ts', import.meta.url), 'utf8'),
	{
		'./form-layout-context': support,
		'./input-group-context': support,
		'../layout/size-context': support,
	},
	false,
)

const model = compiled(
	'model',
	readFileSync(new URL('../src/components/forms/slider-model.windows.ts', import.meta.url), 'utf8'),
	{},
	false,
)

const chrome = compiled(
	'chrome',
	'export function FormField(props) @{ <field>{props.children}</field> }',
)

const slider = compiled(
	'slider',
	readFileSync(
		new URL('../src/components/forms/Slider.windows.tsrx', import.meta.url),
		'utf8',
	).replace(/^import ['"]\.\/(?:slider-control|Slider\.windows\.css)['"]\s*;?$/gm, ''),
	{
		'@octane-xplat/lib': support,
		'./field-context': field,
		'./FormField': chrome,
		'../overlays/escape-props': support,
		'../../internal/layout/style-merge': support,
		'../layout/useMeasure': support,
		'../layout/pan': support,
		'./slider-control': support,
		'./slider-model.windows': model,
	},
)

const { Slider } = await import(slider)
const { focused } = await import(support)
const fixtures = compiled(
	'fixtures',
	`import {FieldProvider} from ${JSON.stringify(field)};
import {Slider} from ${JSON.stringify(slider)};
export function InField(props) @{
 <FieldProvider value={{label:'Inherited volume',isDisabled:props.disabled,isReadOnly:props.readOnly}}>
  <Slider defaultValue={42} onValueChange={props.onValueChange} />
 </FieldProvider>
}`,
)

const { InField } = await import(fixtures)
const tick = () => new Promise((resolve) => setImmediate(resolve))

function mount(props, component = Slider) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const nodes = () => {
		const visit = (children) => children.flatMap((node) => [node, ...visit(node.children ?? [])])
		return visit(container.children)
	}
	const inputs = () => nodes().filter((node) => node.type === 'xplatwindowsslider')
	const surface = () =>
		nodes().find((node) => String(node.props.className).includes('vx-slider-track-windows'))
	root.render(component, props)
	return {
		root,
		nodes,
		inputs,
		surface,
		dispatch: (type, payload) => container.dispatchEvent(surface(), type, payload),
		render: (next) => root.render(component, next),
	}
}

test('uncontrolled defaults seed once, persist and suppress unchanged requests', async () => {
	const changes = []
	const props = { defaultValue: 42, onValueChange: (value) => changes.push(value) }
	const f = mount(props)
	try {
		assert.equal(f.inputs()[0].props.settings.value, 42)
		f.inputs()[0].props.requestChange(65)
		await tick()
		assert.equal(f.inputs()[0].props.settings.value, 65)
		f.inputs()[0].props.requestChange(65)
		f.render({ ...props, defaultValue: 8 })
		assert.equal(f.inputs()[0].props.settings.value, 65)
		assert.deepEqual(changes, [65])
	} finally {
		f.root.unmount()
	}
})

test('controlled requests stay caller-owned and prop updates do not echo', async () => {
	const changes = []
	const props = { value: 42, defaultValue: 8, onValueChange: (value) => changes.push(value) }
	const f = mount(props)
	try {
		f.inputs()[0].props.requestChange(65)
		await tick()
		assert.equal(f.inputs()[0].props.settings.value, 42)
		assert.deepEqual(changes, [65])
		f.render({ ...props, value: 65 })
		assert.equal(f.inputs()[0].props.settings.value, 65)
		f.render({ ...props, value: 65, max: 50 })
		assert.equal(f.inputs()[0].props.settings.value, 50)
		assert.deepEqual(changes, [65])
	} finally {
		f.root.unmount()
	}
})

test('disabled legacy/modern and readonly guards block peer and pan requests', () => {
	for (const guard of [{ disabled: true }, { isDisabled: true }, { isReadOnly: true }]) {
		const changes = []
		const f = mount({ defaultValue: 42, ...guard, onValueChange: (value) => changes.push(value) })
		try {
			const peer = f.inputs()[0]
			assert.equal(peer.props.isEnabled, !(guard.disabled || guard.isDisabled))
			assert.equal(peer.props.settings.readOnly, Boolean(guard.isReadOnly))
			peer.props.requestChange(65)
			f.dispatch('touch', { action: 'down', getX: () => 75 })
			f.dispatch('pan', { state: 'began', dx: 0 })
			f.dispatch('pan', { state: 'moved', dx: 60 })
			assert.equal(f.inputs()[0].props.settings.value, 42)
			assert.deepEqual(changes, [])
		} finally {
			f.root.unmount()
		}
	}
})

test('real Field context supplies accessible name and inherited guards', () => {
	for (const flags of [{ disabled: true }, { readOnly: true }]) {
		const changes = []
		const f = mount({ ...flags, onValueChange: (value) => changes.push(value) }, InField)
		try {
			const peer = f.inputs()[0]
			assert.equal(peer.props.accessibilityLabel, 'Inherited volume')
			assert.equal(peer.props.isEnabled, !flags.disabled)
			assert.equal(peer.props.settings.readOnly, Boolean(flags.readOnly))
			peer.props.requestChange(65)
			assert.deepEqual(changes, [])
			assert.equal(f.nodes().filter((node) => node.type === 'field').length, 0)
		} finally {
			f.root.unmount()
		}
	}
})

test('range peers constrain crossing, preserve the other thumb and share the domain increment', async () => {
	const changes = []
	const f = mount({
		label: 'Price',
		defaultValue: [20, 80],
		onValueChange: (value) => changes.push(value),
	})
	try {
		let [lower, upper] = f.inputs()
		assert.equal(lower.props.accessibilityLabel, 'Price, lower value')
		assert.equal(upper.props.accessibilityLabel, 'Price, upper value')
		assert.equal(lower.props.settings.max, 80)
		assert.equal(upper.props.settings.min, 20)
		assert.equal(lower.props.settings.increment, 1)
		assert.equal(upper.props.settings.increment, 1)
		lower.props.requestChange(90)
		await tick()
		assert.deepEqual(changes, [[80, 80]])

		;[lower, upper] = f.inputs()
		assert.equal(lower.props.settings.value, 80)
		assert.equal(upper.props.settings.min, 80)
		upper.props.requestChange(10)
		await tick()
		assert.deepEqual(changes, [[80, 80]])
	} finally {
		f.root.unmount()
	}
})

test('nearest range thumb uses native local touch coordinates in either event order', async () => {
	for (const touchFirst of [true, false]) {
		const changes = []
		const f = mount({ defaultValue: [20, 80], onValueChange: (value) => changes.push(value) })
		try {
			const touch = () => f.dispatch('touch', { action: 'down', getX: () => 60 })
			const began = () => f.dispatch('pan', { state: 'began', dx: 0, x: 0 })
			if (touchFirst) {
				touch()
				began()
			} else {
				began()
				touch()
			}

			f.dispatch('pan', { state: 'moved', dx: 30 })
			await tick()
			assert.deepEqual(changes, [[30, 80]])
			assert.equal(
				focused.at(-1),
				f.inputs()[0],
				'Pointer focus must receive the selected lower host instance',
			)

			f.dispatch('pan', { state: 'ended', dx: 30 })
			f.dispatch('touch', { action: 'up', getX: () => 90 })
			f.dispatch('touch', { action: 'down', getX: () => 240 })
			f.dispatch('pan', { state: 'began', dx: 0 })
			f.dispatch('pan', { state: 'moved', dx: -30 })
			await tick()
			assert.deepEqual(changes, [
				[30, 80],
				[30, 70],
			])
		} finally {
			f.root.unmount()
		}
	}
})

test('steps anchor to min, fractional values persist and degenerate bounds remain finite', async () => {
	const changes = []
	const f = mount({
		min: 0.5,
		max: 2,
		step: 0.25,
		defaultValue: 0.5,
		onValueChange: (value) => changes.push(value),
	})
	try {
		f.inputs()[0].props.requestChange(0.87)
		await tick()
		assert.deepEqual(changes, [0.75])
		f.render({ min: 3, max: 3, value: NaN })
		assert.equal(f.inputs()[0].props.settings.value, 3)
		assert.equal(f.inputs()[0].props.settings.increment, 1)
		for (const node of f.nodes()) {
			for (const value of Object.values(node.props.style ?? {})) {
				if (typeof value === 'number') {
					assert.ok(Number.isFinite(value))
				}
			}
		}
	} finally {
		f.root.unmount()
	}
})

test('marks and formatted readouts render for scalar and range without changing values', () => {
	const f = mount({
		value: [20, 80],
		valueDisplay: 'text',
		formatValue: (value) => '$' + value,
		marks: [
			{ value: 0, label: 'Start' },
			{ value: 100, label: 'End' },
			{ value: 101, label: 'Outside' },
		],
	})
	try {
		const labels = f
			.nodes()
			.filter((node) => node.type === 'label')
			.map((node) => node.props.text)

		assert.ok(labels.includes('$20 – $80'))
		assert.ok(labels.includes('Start') && labels.includes('End'))
		assert.ok(!labels.includes('Outside'))
		f.render({ value: 42, valueDisplay: 'tooltip', formatValue: (value) => value + '%' })
		assert.ok(f.nodes().some((node) => node.type === 'label' && node.props.text === '42%'))
		assert.equal(f.inputs().length, 1)
	} finally {
		f.root.unmount()
	}
})

test('id className and dynamic style apply to the same component host', () => {
	const f = mount({ id: 'volume', className: 'custom-volume', style: { width: 220, opacity: 0.7 } })
	try {
		const styled = f
			.nodes()
			.filter((node) => String(node.props.className).includes('custom-volume'))

		assert.equal(styled.length, 1)
		assert.equal(styled[0].props.id, 'volume')
		assert.equal(styled[0].props.style.width, 220)
		assert.equal(styled[0].props.style.opacity, 0.7)
	} finally {
		f.root.unmount()
	}
})
