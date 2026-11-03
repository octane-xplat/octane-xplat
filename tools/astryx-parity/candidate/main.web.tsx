import { createRoot } from 'octane'
import { useState } from 'octane'
import { Button, TextInput, TextArea, CheckboxInput, Switch, CheckboxList } from '@octane-xplat/ui'
import { Markdown } from '@octane-xplat/ui/markdown'
import {
	createMarkdownFrontmatter,
	createMarkdownHeadingLinks,
	markdownSoftBreaksPlugin,
	markdownSourceLinesPlugin,
} from '@octane-xplat/ui/markdown'
import {
	buttonScenarios,
	textInputScenarios,
	checkboxScenarios,
	switchScenarios,
	textAreaScenarios,
	checkboxListScenarios,
	markdownScenarios,
	CITATION_SOURCES,
} from '../scenarios/index.ts'

import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
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
					<Button {...scenario.props} testID={`button/${scenario.key}/control`} />
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

function FieldGrid({
	prefix,
	scenarios,
	render,
}: {
	prefix: string
	scenarios: { key: string }[]
	render: (s: any) => any
}) {
	return (
		<div className="parity-grid">
			{scenarios.map((scenario) => (
				<div
					key={scenario.key}
					className="parity-cell parity-cell-field"
					data-sameframe-key={`${prefix}/${scenario.key}`}
				>
					{render(scenario)}
				</div>
			))}
		</div>
	)
}

// Scenario props are written in Astryx's vocabulary; map them here.
const tiProps = (p: any, key: string) => ({ ...p, testID: `text-input/${key}/control` })
const taProps = (p: any, key: string) => ({ ...p, testID: `text-area/${key}/control` })
const cbProps = (p: any, key: string) => ({ ...p, testID: `checkbox/${key}/control` })
const swProps = (p: any, key: string) => ({ ...p, testID: `switch/${key}/control` })

function TextInputGrid() {
	return (
		<FieldGrid
			prefix="text-input"
			scenarios={textInputScenarios}
			render={(s) => <TextInput {...tiProps(s.props, s.key)} onChange={() => {}} />}
		/>
	)
}

function TextAreaGrid() {
	return (
		<FieldGrid
			prefix="text-area"
			scenarios={textAreaScenarios}
			render={(s) => <TextArea {...taProps(s.props, s.key)} onChange={() => {}} />}
		/>
	)
}

function CheckboxGrid() {
	return (
		<FieldGrid
			prefix="checkbox"
			scenarios={checkboxScenarios}
			render={(s) => <CheckboxInput {...cbProps(s.props, s.key)} onChange={() => {}} />}
		/>
	)
}

function SwitchGrid() {
	return (
		<FieldGrid
			prefix="switch"
			scenarios={switchScenarios}
			render={(s) => <Switch {...swProps(s.props, s.key)} onChange={() => {}} />}
		/>
	)
}

function CheckboxListGrid() {
	return (
		<FieldGrid
			prefix="checkbox-list"
			scenarios={checkboxListScenarios}
			render={(s) => <CheckboxList {...s.props} options={s.options} onValueChange={() => {}} />}
		/>
	)
}

function TextInputBehavior() {
	const [value, setValue] = useState('')
	return (
		<>
			<button data-parity-key="before">Before</button>
			<span data-parity-key="input">
				<TextInput
					label="Email"
					value={value}
					onChange={(v: string) => {
						setValue(v)
						window.__parity.events.push(`change:${v}`)
					}}
				/>
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
				<CheckboxInput
					label="Accept terms"
					value={checked}
					onChange={(v: boolean) => {
						setChecked(v)
						window.__parity.events.push(`check:${v}`)
					}}
				/>
			</span>
			<span data-parity-key="indeterminate-box">
				<CheckboxInput
					label="Partial"
					value={mixed}
					onChange={(v: boolean) => {
						setMixed(v)
						window.__parity.events.push(`check:${v}`)
					}}
				/>
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
				<Switch
					label="Notifications"
					value={on}
					onChange={(v: boolean) => {
						setOn(v)
						window.__parity.events.push(`switch:${v}`)
					}}
				/>
			</span>
			<span data-parity-key="disabled-switch">
				<Switch label="Locked" value={true} isDisabled onChange={() => {}} />
			</span>
			<button data-parity-key="after">After</button>
		</>
	)
}

const frontmatter = createMarkdownFrontmatter({ name: 'meta', parse: (fields) => fields })
const markdownPlugins = (profiles?: readonly string[]) =>
	profiles?.map((p) => {
		switch (p) {
			case 'soft-breaks':
				return markdownSoftBreaksPlugin
			case 'frontmatter':
				return frontmatter.plugin
			case 'source-lines':
				return markdownSourceLinesPlugin
			case 'heading-links':
				return createMarkdownHeadingLinks({ permalinkBaseUrl: 'https://docs.example' })
			default:
				throw new RangeError(`unknown plugin profile ${p}`)
		}
	})

const inlinePlugins = [
	{
		pattern: /@(\w+)/g,
		render: (match: RegExpMatchArray, key: string) => <mark key={key}>{match[0]}</mark>,
	},
]

function MarkdownGrid() {
	return (
		<div className="parity-grid">
			{markdownScenarios.map((s) => (
				<div key={s.key} className="parity-cell" data-sameframe-key={`markdown/${s.key}`}>
					<Markdown
						autolink={s.options?.autolink}
						sources={s.options?.sourceIds ? CITATION_SOURCES : undefined}
						plugins={markdownPlugins(s.options?.plugins)}
						inlinePlugins={s.options?.inlinePlugin ? inlinePlugins : undefined}
					>
						{s.source}
					</Markdown>
				</div>
			))}
		</div>
	)
}

function MarkdownBehavior() {
	const doc = '[internal](/docs/page) and [external](https://example.com)'
	return (
		<>
			<span data-parity-key="links">
				<Markdown>{doc}</Markdown>
			</span>
			<span data-parity-key="unsafe-link">
				<Markdown>{'[bad](javascript:alert(1)) ![i](data:text/html,x)'}</Markdown>
			</span>
			<span data-parity-key="citation">
				<Markdown sources={CITATION_SOURCES}>{'Claim [docs] and 【api】.'}</Markdown>
			</span>
			<span data-parity-key="heading-id">
				<Markdown>{'# Alpha\n\n# Alpha'}</Markdown>
			</span>
			<span data-parity-key="inline-display">
				Text <Markdown display="inline">{'**bold** [x](/y)'}</Markdown> tail
			</span>
			<span data-parity-key="task-list">
				<Markdown>{'- [x] done\n- [ ] todo'}</Markdown>
			</span>
			<span data-parity-key="link-cancel">
				<Markdown
					onLinkClick={(href) => {
						window.__parity.events.push(`cancel:${href}`)
						return false
					}}
				>
					{'[cancel](/stop)'}
				</Markdown>
			</span>
			<span data-parity-key="link-allow">
				<Markdown
					onLinkClick={(href) => {
						window.__parity.events.push(`allow:${href}`)
					}}
				>
					{'[allow](/go)'}
				</Markdown>
			</span>
		</>
	)
}

function MarkdownLayout() {
	const keys = ['prose-basic', 'table-layout', 'content-width', 'density-compact'] as const
	return (
		<>
			{keys.map((key) => {
				const s = markdownScenarios.find((x) => x.key === key)!
				return (
					<div key={key} data-parity-key={key} style={{ width: 480, marginBottom: 24 }}>
						<Markdown density={key === 'density-compact' ? 'compact' : 'default'}>{s.source}</Markdown>
					</div>
				)
			})}
		</>
	)
}

const pages: Record<string, { title: string; el: any }> = {
	'/markdown': { title: 'Markdown parity', el: <MarkdownGrid /> },
	'/markdown/behavior': { title: 'Markdown parity', el: <MarkdownBehavior /> },
	'/markdown/layout': { title: 'Markdown parity', el: <MarkdownLayout /> },
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
