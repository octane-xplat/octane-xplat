import { DEMOS } from '@octane-xplat/demos'
import type { Area, CaseSpec } from './types'

import { CORE_CASES } from './core-cases'

export { CORE_CASES } from './core-cases'

const areaFor = (id: string): Area => {
  if (
    [
      'probe',
      'counter',
      'watch',
      'stopwatch',
      'todo',
      'ttt',
      'goal-counter',
      'packing-list',
    ].includes(id)
  ) {
    return 'Rendering'
  }

  if (
    [
      'layout',
      'divergence',
      'props',
      'components',
      'content-display',
      'rich-text',
      'glass',
    ].includes(id)
  ) {
    return 'Layout'
  }

  if (
    [
      'controls',
      'action-controls',
      'search',
      'power-search',
      'segmented',
      'dialer',
      'chat',
      'richtext-editor',
      'tiptap-editor',
      'lexical-editor',
      'native-picker',
      'native-date-picker',
    ].includes(id)
  ) {
    return 'Input'
  }

  if (['overlay', 'modal', 'native-sheet', 'native-context-menu', 'pager'].includes(id)) {
    return 'Navigation'
  }

  if (
    [
      'vlist',
      'vlist-perf',
      'list-demo',
      'scrollbox',
      'pull-refresh',
      'anim',
      'motion-patterns',
      'reorder',
      'fancy-components',
    ].includes(id)
  ) {
    return 'Collections & motion'
  }

  if (id === 'weather') {
    return 'Async state'
  }

  if (id.endsWith('-probe')) {
    return 'Diagnostics'
  }

  return 'Media & services'
}

export const RETAINED_CASES: readonly CaseSpec[] = DEMOS.map((demo) => ({
  id: 'fixture.' + demo.id,
  title: demo.title,
  area: areaFor(demo.id),
  owner: '@octane-xplat/demos',
  expected:
    'Complete the fixture’s interactions, check its visible outputs, and verify cleanup after closing. Mounting alone is not a pass.',
  suite: 'manual',
  fixture: 'demo',
  demo: demo.id,
  tags: ['retained fixture', demo.kind],
  instructions: [
    'Open a fresh fixture. Exercise its controls, including reversal, cancellation and error paths where available.',
    'Compare the visible result with the fixture’s stated behavior. Close and reopen to check reset and cleanup.',
    'Record the actions and observed result. This observation does not establish other targets or OS input.',
  ],
  steps: [],
}))

const manual = (
  id: string,
  title: string,
  area: Area,
  href: string,
  expected: string,
): CaseSpec => ({
  id,
  title,
  area,
  href,
  expected,
  suite: 'manual',
  fixture: 'demo',
  owner: '@octane-xplat/app',
  tags: ['external qualification'],
  instructions: [
    'Open the qualification fixture. Follow its checks using the required host and input tooling.',
    'Return here and record the exact observed behavior and evidence method. External fixture state is not automatically imported.',
  ],
  steps: [],
})

export const CASES: readonly CaseSpec[] = [
  ...CORE_CASES,
  ...RETAINED_CASES,
  manual(
    'qualification.baseline',
    'Existing integrated baseline',
    'Diagnostics',
    '/harness-baseline',
    'Run the maintained baseline smoke or device sweep. This collection retains the original Home / Apps / Test fixture contracts while cases migrate.',
  ),
  manual(
    'qualification.queries',
    'Shared query ownership and recovery',
    'Async state',
    '/cached-users',
    'Verify cached list/detail consistency, rejection, refresh, cancellation and account-owner replacement.',
  ),
  manual(
    'qualification.route-errors',
    'Route render and loader recovery',
    'Navigation',
    '/broken?fail=loader',
    'Observe the error boundary, retry, and navigate away without orphaned loader work.',
  ),
  manual(
    'qualification.unsaved-draft',
    'Navigation protects unsaved work',
    'Navigation',
    '/navigation-blocking',
    'Cancel an attempted navigation, retain the draft, then deliberately discard and leave.',
  ),
  manual(
    'qualification.services',
    'Device services and permissions',
    'Media & services',
    '/harness-baseline',
    'Use Test → Platform services on the selected host. Exercise unavailable, denied and cancelled outcomes; avoid real accounts and external mutations.',
  ),
]

export const AREAS: readonly Area[] = [
  'Rendering',
  'Layout',
  'Input',
  'Navigation',
  'Async state',
  'Collections & motion',
  'Media & services',
  'Diagnostics',
]
