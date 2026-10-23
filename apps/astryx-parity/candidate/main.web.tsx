import { createRoot } from 'octane'
import { Button } from '@octane-xplat/ui'
import { buttonScenarios } from '../scenarios/index.ts'
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

const path = window.location.pathname
const page = path === '/button' ? <Grid /> : path === '/button/behavior' ? <Behavior /> : <Grid />

createRoot(document.getElementById('root')!).render(page)
document.fonts.ready.then(() => {
	document.documentElement.dataset.parityReady = '1'
})
