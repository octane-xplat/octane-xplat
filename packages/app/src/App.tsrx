import { useState, useEffect } from 'octane';
import { Screen, Tabs } from '@xplat/ui';
import { Home } from './Home.tsrx';
import { Settings } from './Settings.tsrx';
import { Gallery } from '@xplat/demos';
import type { TabSpec } from '@xplat/ui';
// Probe-only module: schedules the demo-gallery sweep on native; no-op on web.
import './platform/demosweep';

// Identity-stable tab specs — Tabs is memoized on the array reference, and
// each spec carries a render function (same contract as List.renderItem).
// Render fns are hoisted: JSX inside a module-level object literal can't
// get universal lowering (compile error) — a standalone arrow can.
const renderHome = () => <Home />;
const renderSettings = () => <Settings />;
const renderDemos = () => <Gallery />;
const TABS: TabSpec[] = [
	{ title: 'Home', render: renderHome },
	{ title: 'Settings', render: renderSettings },
	{ title: 'Demos', render: renderDemos },
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
