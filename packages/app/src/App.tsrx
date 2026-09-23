import { useState, useEffect } from 'octane';
import { Screen, Tabs } from '@xplat/ui';
import { Home } from './Home.tsrx';
import { Settings } from './Settings.tsrx';
import type { TabSpec } from '@xplat/ui';

// Identity-stable tab specs — Tabs is memoized on the array reference, and
// each spec carries a render function (same contract as List.renderItem).
// Render fns are hoisted: JSX inside a module-level object literal can't
// get universal lowering (compile error) — a standalone arrow can.
const renderHome = () => <Home />;
const renderSettings = () => <Settings />;
const TABS: TabSpec[] = [
	{ title: 'Home', render: renderHome },
	{ title: 'Settings', render: renderSettings },
];

console.log('[harness] App module evaluated');

/** App shell — a real tab surface. Screen wraps content in the platform
 *  root (rootlayout on native, div on web). */
export function App() @{
	const [tab, setTab] = useState(0);
	console.log('[harness] App render, tab=' + tab);

	useEffect(() => {
		console.log('[harness] App mounted');
	}, []);

	<Screen className="vx-app flex-1">
		<Tabs
			id="app-tabs"
			className="flex-1"
			tabs={TABS}
			selectedIndex={tab}
			onSelectedIndexChanged={(i) => { console.log('[probe] tab -> ' + i); setTab(i); }}
		/>
	</Screen>
}
