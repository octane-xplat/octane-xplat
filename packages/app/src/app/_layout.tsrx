import { useEffect, useState } from 'octane';
import { Screen, RouteOutlet, Tabs, Text, useThemeScheme } from '@octane-xplat/ui';
import { Parity } from './parity';
import { Home } from '../Home.tsrx';
import { Test } from '../Test.tsrx';
import { Gallery } from '@xplat/demos';
import { router } from '@octane-xplat/ui/routing';
import type { TabSpec } from '@octane-xplat/ui';
// Probe-only module: schedules the demo-gallery sweep on native; no-op on web.
import '../platform/demosweep';
// Parity dump step — runs after the sweep via the __xplatSweepDone slot;
// no-op on web (Playwright dumps /parity directly).
import { onParityStageOpen } from '../platform/paritysweep';
// Registers the tab-strip icon glyphs (svg + sys:// pairs).
import '../icons';

// Identity-stable tab specs — Tabs is memoized on the array reference, and
// each spec carries a render function (same contract as List.renderItem).
// Render fns are hoisted: JSX inside a module-level object literal can't
// get universal lowering (compile error) — a standalone arrow can.
const renderHome = () => <Home />;
const renderTest = () => <Test />;
// Chips navigate inside the tab's own stack — the Demos pane is a Frame
// (TabSpec.stack), so demo pushes stay under the tab bar.
const renderApps = () => <Gallery onOpen={(id) => router.push({ to: '/demo/:id', params: { id: id }, stack: 'demos' })} kind="app" title="Apps" />;
const TABS: TabSpec[] = [
	{ key: 'home', title: 'Home', icon: 'tab-home', render: renderHome },
	{ key: 'apps', title: 'Apps', icon: 'tab-demos', render: renderApps, stack: 'demos' },
	// Instrumentation + proofs — last so the familiar tabs stay the first
	// thing a human sees. Its own stack keeps seam-proof pushes local.
	{ key: 'test', title: 'Test', icon: 'tab-test', render: renderTest, stack: 'test' },
];

console.log('[harness] App module evaluated');

/** Root layout — the route dir's shell (app/_layout.tsrx → layouts[''] in
	*  the manifest; the entry renders whatever file fills that slot). A real
	*  tab surface: Screen wraps content in the platform root (rootlayout on
	*  native, div on web). */
export function RootLayout(props: { children?: any }) @{
	// Effective scheme on the shell root: .dark/.ns-dark here re-themes the
	// tab bar + every pane (tokens inherit); separate roots (pushed pages,
	// overlays) get stamped by theme-scheme's host hooks instead.
	const scheme = useThemeScheme();

	console.log('[harness] App render');

	// Parity sweep mounts its stage inline instead of pushing /parity — the
	// AppKit host presents pushed root routes as surfaces that automation
	// can't keep alive long enough to measure.
	const [parityOpen, setParityOpen] = useState(false);
	useEffect(() => onParityStageOpen(() => setParityOpen(true)), []);

	useEffect(() => {
		console.log('[harness] App mounted');
	}, []);

	if (parityOpen) {
		return <Parity />;
	}

	// Pushed root routes are wrapped in this layout by the native route host.
	// Let their screen fill the page; the initial app render has no child and
	// uses the tab shell below.
	if (props.children != null) {
		return <>{props.children}</>;
	}

	<Screen className={['vx-app', 'vx-app-flush', 'flex-1', scheme === 'dark' ? 'dark ns-dark' : '']}>
		<RouteOutlet>
		<Tabs
			id="app-tabs"
			className="flex-1"
			tabs={TABS}
			defaultSelectedKey="home"
			onSelectionChange={(key) => { console.log('[probe] tab -> ' + key); }}
		/>
		</RouteOutlet>
	</Screen>
}
