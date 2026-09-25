import { useState, useEffect } from 'octane';
import { Screen, Tabs, Text, currentRoute, useThemeScheme } from '@octane-xplat/ui';
import { routes, screens } from '../routes';
import { Home } from '../Home.tsrx';
import { Settings } from '../Settings.tsrx';
import { Gallery } from '@xplat/demos';
import { navigate } from '../platform/nav';
import type { TabSpec } from '@octane-xplat/ui';
// Probe-only module: schedules the demo-gallery sweep on native; no-op on web.
import '../platform/demosweep';

// Identity-stable tab specs — Tabs is memoized on the array reference, and
// each spec carries a render function (same contract as List.renderItem).
// Render fns are hoisted: JSX inside a module-level object literal can't
// get universal lowering (compile error) — a standalone arrow can.
const renderHome = () => <Home />;
const renderSettings = () => <Settings />;
// Chips navigate inside the tab's own stack — the Demos pane is a Frame
// (TabSpec.stack), so demo pushes stay under the tab bar.
const renderDemos = () => <Gallery onOpen={(id) => navigate('demo/:id', { id }, { into: 'demos' })} />;
const resolveRoute = (name: string, params: Record<string, unknown>) => {
	const C = screens[name];
	if (!C) return <Text>404: {name}</Text>;
	let content = <C {...params} />;
	const meta = routes.routes.find((entry) => entry.name === name);
	const relative = meta?.file.replace(/^.*?app\//, '');
	const dirs = relative ? relative.split('/').slice(0, -1) : [];
	for (let depth = dirs.length; depth > 0; depth--) {
		const Layout = routes.layouts[dirs.slice(0, depth).join('/')];
		if (Layout) {
			const nested = content;
			content = <Layout>{nested}</Layout>;
		}
	}

	return content;
};

const TABS: TabSpec[] = [
	{ title: 'Home', render: renderHome },
	{ title: 'Settings', render: renderSettings },
	{ title: 'Demos', render: renderDemos, stack: 'demos' },
];

console.log('[harness] App module evaluated');

/** Root layout — the route dir's shell (app/_layout.tsrx → layouts[''] in
 *  the manifest; the entry renders whatever file fills that slot). A real
 *  tab surface: Screen wraps content in the platform root (rootlayout on
 *  native, div on web). */
export function RootLayout() @{
	// Deep link: a URL like /demos/demo/counter boots into the Demos tab
	// with the pushed screen already on its stack (web leaf; currentRoute is
	// a no-op null on native).
	const [tab, setTab] = useState(() => {
		const r = currentRoute();
		const i = r ? TABS.findIndex((t) => t.stack === r.stack) : -1;
		return i >= 0 ? i : 0;
	});
	// Effective scheme on the shell root: .dark/.ns-dark here re-themes the
	// tab bar + every pane (tokens inherit); separate roots (pushed pages,
	// overlays) get stamped by theme-scheme's host hooks instead.
	const scheme = useThemeScheme();

	console.log('[harness] App render, tab=' + tab);

	useEffect(() => {
		console.log('[harness] App mounted');
	}, []);

	<Screen className={['vx-app', 'vx-app-flush', 'flex-1', scheme === 'dark' ? 'dark ns-dark' : '']}>
		<Tabs
			id="app-tabs"
			className="flex-1"
			tabs={TABS}
			selectedIndex={tab}
			onSelectedIndexChanged={(i) => { console.log('[probe] tab -> ' + i); setTab(i); }}
			resolveScreen={resolveRoute}
		/>
	</Screen>
}
