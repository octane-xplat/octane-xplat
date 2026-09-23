import { useState, useEffect } from 'octane';
import { Screen, Tabs, Text, currentRoute } from '@octane-xplat/ui';
import { screens } from './screens';
import { Home } from './Home.tsrx';
import { Settings } from './Settings.tsrx';
import { Gallery } from '@xplat/demos';
import { navigate } from './platform/nav';
import type { TabSpec } from '@octane-xplat/ui';
// Probe-only module: schedules the demo-gallery sweep on native; no-op on web.
import './platform/demosweep';

// Identity-stable tab specs — Tabs is memoized on the array reference, and
// each spec carries a render function (same contract as List.renderItem).
// Render fns are hoisted: JSX inside a module-level object literal can't
// get universal lowering (compile error) — a standalone arrow can.
const renderHome = () => <Home />;
const renderSettings = () => <Settings />;
// Chips navigate inside the tab's own stack — the Demos pane is a Frame
// (TabSpec.stack), so demo pushes stay under the tab bar.
const renderDemos = () => <Gallery onOpen={(id) => navigate('demo', { id }, { into: 'demos' })} />;
const TABS: TabSpec[] = [
	{ title: 'Home', render: renderHome },
	{ title: 'Settings', render: renderSettings },
	{ title: 'Demos', render: renderDemos, stack: 'demos' },
];

console.log('[harness] App module evaluated');

/** App shell — a real tab surface. Screen wraps content in the platform
 *  root (rootlayout on native, div on web). */
export function App() @{
	// Deep link: a URL like /demos/demo?id=counter boots into the Demos tab
	// with the pushed screen already on its stack (web leaf; currentRoute is
	// a no-op null on native).
	const [tab, setTab] = useState(() => {
		const r = currentRoute();
		const i = r ? TABS.findIndex((t) => t.stack === r.stack) : -1;
		return i >= 0 ? i : 0;
	});
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
			resolveScreen={(name, params) => {
				const C = screens[name as keyof typeof screens];
				return C ? <C {...params} /> : <Text>404: {name}</Text>;
			}}
		/>
	</Screen>
}
