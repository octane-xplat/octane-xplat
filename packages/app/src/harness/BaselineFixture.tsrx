/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useState } from 'octane'
import { Screen, RouteOutlet, Tabs, HStack, NavLink, Text, useThemeScheme } from '@octane-xplat/ui'
import { Parity } from '../app/parity.tsrx'
import { Home } from '../Home.tsrx'
import { Test } from '../Test.tsrx'
import { Gallery } from '@octane-xplat/demos'
import { router } from '@octane-xplat/ui/routing'
import type { TabSpec } from '@octane-xplat/ui'
// Parity dump step — runs after the sweep via the __xplatSweepDone slot;
// no-op on web (Playwright dumps /parity directly).
import { onParityStageOpen } from '../platform/paritysweep'
// Registers the tab-strip icon glyphs (svg + sys:// pairs).
import '../icons'

// Identity-stable tab specs — Tabs is memoized on the array reference, and
// each spec carries a render function (same contract as List.renderItem).
// Render fns are hoisted: JSX inside a module-level object literal can't
// get universal lowering (compile error) — a standalone arrow can.
const renderHome = () => <Home />
const renderTest = () => <Test />
// Chips navigate inside the tab's own stack — the Demos pane is a Frame
// (TabSpec.stack), so demo pushes stay under the tab bar.
const renderApps = () => (
  <Gallery
    onOpen={(id) => router.push({ to: '/demo/:id', params: { id: id }, stack: 'demos' })}
    kind="app"
    title="Apps"
  />
)

const TABS: TabSpec[] = [
  { key: 'home', title: 'Home', icon: 'tab-home', render: renderHome },
  { key: 'apps', title: 'Apps', icon: 'tab-demos', render: renderApps, stack: 'demos' },
  // Instrumentation + proofs — last so the familiar tabs stay the first
  // thing a human sees. Its own stack keeps seam-proof pushes local.
  { key: 'test', title: 'Test', icon: 'tab-test', render: renderTest, stack: 'test' },
]

console.log('[harness] App module evaluated')

/** Retained integration shell. Open /harness-baseline or the web baseline launch mode. */
export function BaselineFixture() @{
  useEffect(() => {
    void import('../platform/demosweep')
  }, [])

  // Effective scheme on the shell root: .dark/.ns-dark here re-themes the
  // tab bar + every pane (tokens inherit); separate roots (pushed pages,
  // overlays) get stamped by theme-scheme's host hooks instead.
  const scheme = useThemeScheme()

  console.log('[harness] App render')

  // Parity sweep mounts its stage inline instead of pushing /parity — the
  // AppKit host presents pushed root routes as surfaces that automation
  // can't keep alive long enough to measure.
  const [parityOpen, setParityOpen] = useState(false)

  useEffect(() => onParityStageOpen(() => setParityOpen(true)), [])

  useEffect(() => {
    console.log('[harness] App mounted')
  }, [])

  if (parityOpen) {
    return <Parity />
  }

  <Screen
    className={[
      'vx-app',
      'sink-shell',
      'vx-app-flush',
      'flex-1',
      scheme === 'dark' ? 'dark ns-dark' : '',
    ]}
  >
    <RouteOutlet>
      <HStack className="sc-masthead">
        <Text className="sc-brand-name">Baseline fixtures</Text>
        <NavLink to="/harness" className="btn btn-secondary">
          <Text>Back to test console →</Text>
        </NavLink>
      </HStack>
      <Tabs
        id="app-tabs"
        className="flex-1"
        tabs={TABS}
        defaultSelectedKey="home"
        onSelectionChange={(key) => {
          console.log('[probe] tab -> ' + key)
        }}
      />
    </RouteOutlet>
  </Screen>
}
