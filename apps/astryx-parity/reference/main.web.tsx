import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { TextArea } from '@astryxdesign/core/TextArea'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { CheckboxList, CheckboxListItem } from '@astryxdesign/core/CheckboxList'
import { Switch } from '@astryxdesign/core/Switch'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { buttonScenarios, textInputScenarios, checkboxScenarios, switchScenarios, textAreaScenarios, checkboxListScenarios } from '../scenarios/index.ts'
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '../shared/stage.css'

declare global {
	interface Window {
		__parity: { events: string[]; resolve(): void }
	}
}

window.__parity = {
	events: [],
	resolve() {
		resolvePending?.()
	},
}

let resolvePending: (() => void) | undefined

function Grid() {
	return (
		<div className="parity-grid">
			{buttonScenarios.map((scenario) => (
				<div
					key={scenario.key}
					className="parity-cell"
					data-sameframe-key={`button/${scenario.key}`}
					style={scenario.cellWidth ? { width: scenario.cellWidth } : undefined}
				>
					<Button {...scenario.props} data-testid={`button/${scenario.key}/control`} />
				</div>
			))}
		</div>
	)
}

function Behavior() {
	return (
		<>
			<button data-parity-key="before">Before</button>
			<span data-parity-key="sync">
				<Button
					label="Sync"
					variant="secondary"
					size="md"
					clickAction={() => {
						window.__parity.events.push('sync')
					}}
				/>
			</span>
			<span data-parity-key="disabled">
				<Button
					label="Disabled"
					variant="secondary"
					size="md"
					isDisabled
					clickAction={() => {
						window.__parity.events.push('disabled')
					}}
				/>
			</span>
			<span data-parity-key="async">
				<Button
					label="Async"
					variant="secondary"
					size="md"
					clickAction={() => {
						window.__parity.events.push('async:start')
						return new Promise<void>((resolve) => {
							resolvePending = () => {
								resolve()
								window.__parity.events.push('async:end')
							}
						})
					}}
				/>
			</span>
			<button data-parity-key="after">After</button>
		</>
	)
}

function FieldGrid({ prefix, scenarios, render }: { prefix: string; scenarios: { key: string; cellWidth?: number }[]; render: (s: any) => React.ReactNode }) {
	return (
		<div className="parity-grid">
			{scenarios.map((scenario) => (
				<div
					key={scenario.key}
					className="parity-cell parity-cell-field"
					data-sameframe-key={`${prefix}/${scenario.key}`}
					style={scenario.cellWidth ? { width: scenario.cellWidth } : undefined}
				>
					{render(scenario)}
				</div>
			))}
		</div>
	)
}

function TextInputGrid() {
	return <FieldGrid prefix="text-input" scenarios={textInputScenarios} render={(s) => (
		<TextInput {...s.props} onChange={() => {}} data-testid={`text-input/${s.key}/control`} />
	)} />
}
function TextAreaGrid() {
	return <FieldGrid prefix="text-area" scenarios={textAreaScenarios} render={(s) => (
		<TextArea {...s.props} onChange={() => {}} data-testid={`text-area/${s.key}/control`} />
	)} />
}

function CheckboxGrid() {
	return <FieldGrid prefix="checkbox" scenarios={checkboxScenarios} render={(s) => (
		<CheckboxInput {...s.props} onChange={() => {}} data-testid={`checkbox/${s.key}/control`} />
	)} />
}

function SwitchGrid() {
	return <FieldGrid prefix="switch" scenarios={switchScenarios} render={(s) => (
		<Switch {...s.props} onChange={() => {}} data-testid={`switch/${s.key}/control`} />
	)} />
}

function CheckboxListGrid() {
	return <FieldGrid prefix="checkbox-list" scenarios={checkboxListScenarios} render={(s) => (
		<CheckboxList {...s.props} onChange={() => {}}>
			{s.options.map((o: { value: string; label: string; isDisabled?: boolean }) => <CheckboxListItem key={o.value} value={o.value} label={o.label} isDisabled={o.isDisabled} />)}
		</CheckboxList>
	)} />
}

// Per-route behavior fixtures: a controlled, observable control per component.
function TextInputBehavior() {
	const [value, setValue] = useState('')
	return (
		<>
			<button data-parity-key="before">Before</button>
			<span data-parity-key="input">
				<TextInput label="Email" value={value} onChange={(v) => { setValue(v); window.__parity.events.push(`change:${v}`) }} />
			</span>
			<span data-parity-key="disabled-input">
				<TextInput label="Email" isDisabled value="" onChange={() => {}} />
			</span>
			<button data-parity-key="after">After</button>
		</>
	)
}

function CheckboxBehavior() {
	const [checked, setChecked] = useState(false)
	const [mixed, setMixed] = useState<'indeterminate' | boolean>('indeterminate')
	return (
		<>
			<button data-parity-key="before">Before</button>
			<span data-parity-key="box">
				<CheckboxInput label="Accept terms" value={checked} onChange={(v) => { setChecked(v); window.__parity.events.push(`check:${v}`) }} />
			</span>
			<span data-parity-key="indeterminate-box">
				<CheckboxInput label="Partial" value={mixed} onChange={(v) => { setMixed(v); window.__parity.events.push(`check:${v}`) }} />
			</span>
			<span data-parity-key="disabled-box">
				<CheckboxInput label="Locked" value={false} isDisabled onChange={() => {}} />
			</span>
			<button data-parity-key="after">After</button>
		</>
	)
}

function SwitchBehavior() {
	const [on, setOn] = useState(false)
	return (
		<>
			<button data-parity-key="before">Before</button>
			<span data-parity-key="switch">
				<Switch label="Notifications" value={on} onChange={(v) => { setOn(v); window.__parity.events.push(`switch:${v}`) }} />
			</span>
			<span data-parity-key="disabled-switch">
				<Switch label="Locked" value={true} isDisabled onChange={() => {}} />
			</span>
			<button data-parity-key="after">After</button>
		</>
	)
}

const pages: Record<string, { title: string; el: React.ReactNode }> = {
	'/button': { title: 'Button parity', el: <Grid /> },
	'/button/behavior': { title: 'Button parity', el: <Behavior /> },
	'/text-input': { title: 'TextInput parity', el: <TextInputGrid /> },
	'/text-area': { title: 'TextArea parity', el: <TextAreaGrid /> },
	'/text-input/behavior': { title: 'TextInput parity', el: <TextInputBehavior /> },
	'/checkbox': { title: 'Checkbox parity', el: <CheckboxGrid /> },
	'/checkbox/behavior': { title: 'Checkbox parity', el: <CheckboxBehavior /> },
	'/switch': { title: 'Switch parity', el: <SwitchGrid /> },
	'/switch/behavior': { title: 'Switch parity', el: <SwitchBehavior /> },
	'/checkbox-list': { title: 'CheckboxList parity', el: <CheckboxListGrid /> },
}
const page = (pages[window.location.pathname] ?? pages['/button']).el
document.title = pages[window.location.pathname]?.title ?? 'Button parity'

createRoot(document.getElementById('root')!).render(page)
document.fonts.ready.then(() => {
	document.documentElement.dataset.parityReady = '1'
})
