/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useState } from 'octane'
import {
  Button,
  HStack,
  NavLink,
  RouteOutlet,
  Screen,
  ScrollableArea,
  Text,
  TextArea,
  SearchInput,
  View,
  useThemeScheme,
} from '@octane-xplat/ui'

import { useStore } from '@octane-xplat/ui/data'
import { files } from '@octane-xplat/files'
import { router } from '@octane-xplat/ui/routing'
import { AREAS, CASES, CORE_CASES } from './harness/catalog'
import {
  attachHarnessHost,
  closeFixture,
  harnessEnvironment,
  harnessRunner,
  harnessState,
  openFixture,
  observationDrafts,
  recordObservation,
  runChecks,
  selectCase,
} from './harness/controller'

import { FixtureStage } from './harness/Fixtures.tsrx'
import type { CaseSpec, CaseResult } from './harness/types'

function CaseDetail(props: { spec: CaseSpec; locked: boolean; mounted: boolean }) @{
  const spec = props.spec
  const qualificationUrl = spec.href
  const drafts = useStore(observationDrafts)
  const note = drafts[spec.id] ?? ''
  const setNote = (value: string) =>
    observationDrafts.update((notes) => ({ ...notes, [spec.id]: value }))

  <View className="hc-column hc-case-detail">
    <Text className="hc-eyebrow">{spec.area + ' / ' + spec.suite}</Text>
    <Text className="hc-heading">{spec.title}</Text>
    <Text className="hc-code">{spec.id}</Text>
    <Text className="hc-meta">
      {'Owner: ' + spec.owner + (spec.tags.length ? ' · ' + spec.tags.join(' · ') : '')}
    </Text>
    <View className="hc-callout hc-column">
      <Text className="hc-label">Expected result</Text>
      <Text>{spec.expected}</Text>
    </View>
    <HStack className="hc-actions">
      @if (spec.suite === 'core') {
        <Button
          id="hc-run-case"
          label="Run this case"
          isDisabled={props.locked}
          pressAction={() => runChecks([spec])}
        />
      }
      @if (spec.href) {
        <Button
          label="Open qualification fixture ↗"
          variant="secondary"
          isDisabled={props.locked}
          onPress={() => {
            if (qualificationUrl) {
              void router.navigateUrl(qualificationUrl)
            }
          }}
        />
      } @else {
        <Button
          id="hc-open-fixture"
          label="Open / reset fixture"
          variant="secondary"
          isDisabled={props.locked}
          pressAction={() => openFixture(spec)}
        />
      }
      <Button
        label="Close fixture"
        variant="secondary"
        isDisabled={props.locked || !props.mounted}
        pressAction={closeFixture}
      />
    </HStack>
    @if (spec.suite === 'core') {
      <View className="hc-column hc-step-list">
        <Text className="hc-label">Steps</Text>
        @for (const step of spec.steps; index i; key i) {
          <Text className="hc-meta">{i + 1 + '. ' + step.name}</Text>
        }
      </View>
    } @else {
      <View className="hc-column hc-step-list">
        <Text className="hc-label">Manual qualification</Text>
        @for (const instruction of spec.instructions; index i; key i) {
          <Text className="hc-meta">{i + 1 + '. ' + instruction}</Text>
        }
      </View>
    }
    @if (props.mounted || spec.href) {
      <View className="hc-column hc-observation">
        <Text className="hc-label">Record a separate manual observation</Text>
        <TextArea
          id="hc-observation"
          label="Actions and observed result"
          value={note}
          onChange={setNote}
          rows={3}
        />
        <HStack className="hc-actions">
          <Button
            label="Record manual pass"
            variant="secondary"
            isDisabled={props.locked || !note.trim()}
            onPress={() => recordObservation(spec, 'passed', note)}
          />
          <Button
            label="Record failure"
            variant="secondary"
            isDisabled={props.locked || !note.trim()}
            onPress={() => recordObservation(spec, 'failed', note)}
          />
          <Button
            label="Record blocked"
            variant="secondary"
            isDisabled={props.locked || !note.trim()}
            onPress={() => recordObservation(spec, 'blocked', note)}
          />
        </HStack>
      </View>
    }
  </View>
}

function ResultDetail(props: { result: CaseResult }) @{
  const result = props.result

  <View className="hc-column hc-result-detail">
    <Text className="hc-code">{result.caseId + ' / ' + result.runId}</Text>
    <Text>{result.message}</Text>
    <Text className="hc-meta">
      {result.target +
        ' · ' +
        result.build +
        ' · ' +
        result.evidence +
        ' · ' +
        result.durationMs +
        ' ms'}
    </Text>
    <Text className="hc-meta">{result.startedAt}</Text>
    @for (const step of result.steps; index i; key i) {
      <View className="hc-column hc-result-step">
        <Text className="hc-label">{step.name}</Text>
        <Text className="hc-meta">{'Expected: ' + step.expected}</Text>
        <Text className="hc-meta">{'Observed: ' + step.observed}</Text>
      </View>
    }
    <NavLink to="/harness/:caseId" params={{ caseId: result.caseId }} className="hc-case-link">
      <Text>Open case and rerun →</Text>
    </NavLink>
  </View>
}

function Console() @{
  const state = useStore(harnessState)
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('All')
  const [suite, setSuite] = useState('All')
  const [status, setStatus] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)
  const locked = state.busy || state.preparing || !!state.fault || !!harnessRunner.quarantine
  const spec = CASES.find((c) => c.id === state.selected)
  const mountedSpec = CASES.find((c) => c.id === state.mounted?.caseId)
  const latest = new Map<string, CaseResult>()

  for (const result of state.results) {
    if (!latest.has(result.caseId)) {
      latest.set(result.caseId, result)
    }
  }

  const filtered = CASES.filter(
    (c) =>
      (area === 'All' || c.area === area) &&
      (suite === 'All' ||
        (suite === 'Core'
          ? c.suite === 'core'
          : suite === 'External'
            ? !!c.href
            : c.suite === 'manual' && !c.href)) &&
      (status === 'All' ||
        (status === 'Not run'
          ? !latest.has(c.id)
          : latest.get(c.id)?.status === status.toLowerCase())) &&
      `${c.id} ${c.title} ${c.owner} ${c.area} ${c.tags.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )

  const failures = [...latest.values()].filter((r) => r.status === 'failed')
  const openCase = async (id: string) => {
    await selectCase(id)
  }

  <View id="harness-console" className="hc-column hc-console">
    <HStack className="hc-toolbar hc-heading-row">
      <View className="hc-column hc-brand">
        <Text className="hc-title">Sanity harness</Text>
        <Text className="hc-meta">
          {harnessEnvironment.target + ' · ' + harnessEnvironment.build}
        </Text>
      </View>
      <HStack className="hc-actions">
        <Button
          id="hc-run-core"
          label={state.busy ? 'Running…' : 'Run core checks'}
          isDisabled={locked}
          pressAction={() => runChecks()}
        />
        <Button
          id="hc-stop"
          label="Stop run"
          variant="secondary"
          isDisabled={!state.busy}
          onPress={() => harnessRunner.cancel()}
        />
        @if (!state.busy && !state.preparing) {
          <NavLink to="/showcase" className="hc-back">
            <Text>Back to showcase →</Text>
          </NavLink>
        }
      </HStack>
    </HStack>
    <HStack className="hc-tabs">
      @for (const tab of ['overview', 'cases', 'results'] as const; key tab) {
        <Button
          id={'hc-tab-' + tab}
          label={
            tab === 'overview'
              ? 'Overview'
              : tab === 'cases'
                ? 'Cases'
                : 'Results (' + state.results.length + ')'
          }
          variant={state.view === tab ? 'primary' : 'secondary'}
          onPress={() => harnessState.update((s) => ({ ...s, view: tab }))}
        />
      }
    </HStack>
    <Text id="hc-notice" className="hc-notice" accessibilityLiveRegion="polite">
      {state.fault ?? harnessRunner.quarantine ?? state.notice}
    </Text>
    @if (harnessEnvironment.unavailable) {
      <Text className="hc-callout">{harnessEnvironment.unavailable}</Text>
    }
    @if (state.view === 'overview') {
      <View className="hc-column">
        <HStack className="hc-metrics">
          <View className="hc-metric hc-column">
            <Text className="hc-number">{CORE_CASES.length}</Text>
            <Text>Core contracts</Text>
          </View>
          <View className="hc-metric hc-column">
            <Text className="hc-number">
              {CASES.filter((c) => c.suite === 'manual' && !c.href).length}
            </Text>
            <Text>Retained manual fixtures</Text>
          </View>
          <View className="hc-metric hc-column">
            <Text className="hc-number">{failures.length}</Text>
            <Text>Latest failures</Text>
          </View>
          <View className="hc-metric hc-column">
            <Text className="hc-number">{CASES.length - latest.size}</Text>
            <Text>Not run this session</Text>
          </View>
        </HStack>
        <Text className="hc-heading">Run a small suite. Inspect a precise failure.</Text>
        <Text>
          Core checks cover state, keyed ownership, cleanup, visibility, table geometry,
          controls, asynchronous ownership, route retention, and sheet dismissal. Each case
          starts fresh and tears down before the next.
        </Text>
        <View className="hc-callout hc-column">
          <Text className="hc-label">Evidence is scoped to how the check ran.</Text>
          <Text>
            Automatic web checks dispatch DOM events and inspect DOM state or geometry. They
            do not prove pointer hit-testing, OS input, pixels, or screen-reader behavior.
            Browser-input qualification runs separately against the same core case steps.
          </Text>
          <Text>
            Manual observations are labeled separately. Opening a fixture is never counted as
            a pass. Results are session-only; export them before closing this host.
          </Text>
        </View>
        <Text className="hc-label">Coverage areas</Text>
        <HStack className="hc-actions">
          @for (const group of AREAS; key group) {
            <Button
              label={group + ' (' + CASES.filter((c) => c.area === group).length + ')'}
              variant="secondary"
              onPress={() => {
                setArea(group)
                harnessState.update((s) => ({ ...s, view: 'cases' }))
              }}
            />
          }
        </HStack>
        @if (failures.length) {
          <View className="hc-column">
            <Text className="hc-heading">Needs attention</Text>
            @for (const failure of failures; key failure.caseId) {
              <Button
                label={failure.title}
                variant="secondary"
                isDisabled={locked}
                onPress={() => {
                  void openCase(failure.caseId)
                }}
              />
            }
          </View>
        }
        <NavLink to="/harness-baseline" className="hc-case-link">
          <Text>Open existing integrated baseline →</Text>
        </NavLink>
        <Text className="hc-meta">
          The baseline retains the original Home / Apps / Test contracts for existing smoke
          and device sweeps. Retained fixtures await focused contract migration; they do not
          add automatic passes.
        </Text>
      </View>
    }
    @if (state.view === 'cases') {
      <View className="hc-case-layout">
        <View className="hc-column hc-catalog">
          <SearchInput
            id="hc-search"
            label="Find a case"
            placeholder="Name, ID, owner, or tag"
            value={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
          />
          <HStack className="hc-actions">
            @for (const choice of ['All', 'Core', 'Retained', 'External']; key choice) {
              <Button
                label={choice}
                size="sm"
                variant={suite === choice ? 'primary' : 'secondary'}
                onPress={() => setSuite(choice)}
              />
            }
          </HStack>
          <HStack className="hc-actions">
            @for (const choice of [
                'All',
                'Failed',
                'Blocked',
                'Unsupported',
                'Not run',
              ]; key choice) {
              <Button
                label={choice}
                size="sm"
                variant={status === choice ? 'primary' : 'secondary'}
                onPress={() => setStatus(choice)}
              />
            }
          </HStack>
          <HStack className="hc-actions">
            <Button
              label={'Area: ' + area}
              size="sm"
              variant="secondary"
              onPress={() => setArea('All')}
            />
            <Text id="hc-case-count" className="hc-meta">
              {filtered.length + (filtered.length === 1 ? ' case' : ' cases')}
            </Text>
          </HStack>
          @for (const candidate of filtered; key candidate.id) {
            <View
              className={[
                'hc-case-row',
                candidate.id === state.selected ? 'hc-case-row-selected' : '',
              ]}
            >
              <Button
                label={candidate.title}
                variant="secondary"
                isDisabled={locked}
                onPress={() => {
                  void openCase(candidate.id)
                }}
              />
              <Text className="hc-code">{candidate.id}</Text>
              <Text className="hc-meta">
                {candidate.area +
                  ' · ' +
                  (latest.get(candidate.id)?.status ?? 'not run') +
                  ' · ' +
                  (latest.get(candidate.id)?.evidence ?? candidate.suite)}
              </Text>
              <NavLink
                to="/harness/:caseId"
                params={{ caseId: candidate.id }}
                className="hc-permalink"
              >
                <Text>Case link ↗</Text>
              </NavLink>
            </View>
          } @empty {
            <Text>
              No cases match these filters. Clear the search or change the filters.
            </Text>
          }
        </View>
        <View className="hc-column hc-workbench">
          @if (spec) {
            <CaseDetail
              spec={spec}
              locked={locked}
              mounted={state.mounted?.caseId === spec.id}
            />
          } @else {
            <View className="hc-callout hc-column">
              <Text className="hc-heading">Select a case</Text>
              <Text>
                Read its contract, open a fresh fixture, or run its checks. Stable case
                links can be shared with a reproduction.
              </Text>
            </View>
          }
        </View>
      </View>
    }
    @if (state.mounted && mountedSpec) {
      <View className="hc-column hc-live-stage">
        <Text className="hc-label">{'Live fixture / ' + mountedSpec.id}</Text>
        @for (const mounted of [state.mounted]; key mounted.generation) {
          <FixtureStage mounted={mounted} spec={mountedSpec} />
        }
      </View>
    }
    @if (state.view === 'results') {
      <View className="hc-column">
        <HStack className="hc-toolbar">
          <Text className="hc-heading">Session results</Text>
          <Button
            id="hc-export"
            label="Export JSON"
            variant="secondary"
            isDisabled={!state.results.length || state.busy}
            pressAction={async () => {
              const copy = await files.writeText(
                'harness-results.json',
                JSON.stringify(
                  {
                    schemaVersion: 1,
                    exportedAt: new Date().toISOString(),
                    environment: harnessEnvironment,
                    results: state.results,
                  },
                  null,
                  2,
                ),
              )

              files.release(copy)
            }}
          />
        </HStack>
        <Text className="hc-meta">
          Up to 200 results from this host session. A pass applies only to the recorded case,
          target, build, and evidence method.
        </Text>
        @for (const result of state.results; key result.runId + result.caseId) {
          <View className="hc-result hc-column">
            <HStack className="hc-toolbar">
              <Button
                label={result.title}
                variant="secondary"
                onPress={() =>
                  setExpanded(
                    expanded === result.runId + result.caseId
                      ? null
                      : result.runId + result.caseId,
                  )
                }
              />
              <Text className={'hc-status hc-status-' + result.status}>
                {result.status}
              </Text>
            </HStack>
            <Text className="hc-meta">{result.caseId + ' · ' + result.evidence}</Text>
            <Text>{result.message}</Text>
            @if (
              expanded ===
              result.runId + result.caseId
            ) {
              <ResultDetail result={result} />
            }
          </View>
        } @empty {
          <Text>
            No results yet. Run core checks, run an individual case, or record a manual
            observation.
          </Text>
        }
      </View>
    }
  </View>
}

export function Harness(props: { caseId?: string }) @{
  const scheme = useThemeScheme()

  useEffect(() => attachHarnessHost(), [])
  useEffect(() => {
    if (props.caseId) {
      void selectCase(props.caseId)
    }
  }, [props.caseId])

  <Screen className={['vx-app', 'hc-root', scheme === 'dark' ? 'dark ns-dark' : '']}>
    <RouteOutlet>
      <ScrollableArea className="hc-scroll flex-1 min-h-0">
        <Console />
      </ScrollableArea>
    </RouteOutlet>
  </Screen>
}
