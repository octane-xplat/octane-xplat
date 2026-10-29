/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot } from 'octane'
import { View, Text, Link, postToHost } from '@octane-xplat/ui'
import { GoalCounter } from '@xplat/demos/GoalCounter.tsrx'
import { PackingList } from '@xplat/demos/PackingList.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './demo.css'

const packing = new URLSearchParams(location.search).get('demo') === 'packing-list'
createRoot(document.getElementById('root')!).render(
	<View className="demo-standalone">
		<Link href={packing ? '/packing-list' : '/goal-counter'} target="_top">
			Back to docs
		</Link>
		<Text className="demo-description">Browser demo · session-only state</Text>
		{packing ? <PackingList /> : <GoalCounter />}
	</View>,
)

// The host treats a document load without this rendered-app handshake as failure.
requestAnimationFrame(() =>
	postToHost({
		type: 'xplat-demo-ready',
		demo: packing ? 'packing-list' : 'goal-counter',
		token: new URLSearchParams(location.search).get('token'),
	}),
)
