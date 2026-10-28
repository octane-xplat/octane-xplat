/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot } from 'octane'
import { GoalCounter } from '@xplat/demos/GoalCounter.tsrx'
import { PackingList } from '@xplat/demos/PackingList.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './demo.css'

const packing = new URLSearchParams(location.search).get('demo') === 'packing-list'
createRoot(document.getElementById('root')!).render(
	<main className="demo-standalone">
		<a href={packing ? '/packing-list' : '/goal-counter'} target="_top">
			Back to docs
		</a>
		<p>Browser demo · session-only state</p>
		{packing ? <PackingList /> : <GoalCounter />}
	</main>,
)

// The parent treats a document load without this rendered-app handshake as failure.
requestAnimationFrame(() =>
	parent.postMessage(
		{
			type: 'xplat-demo-ready',
			demo: packing ? 'packing-list' : 'goal-counter',
			token: new URLSearchParams(location.search).get('token'),
		},
		location.origin,
	),
)
