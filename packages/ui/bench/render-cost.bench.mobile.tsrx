/** @jsxImportSource @octane-xplat/jsx */
// Render-cost microbenchmark for the hot native primitives (Text, Pressable,
// View, Grid) under the universal runtime and Octane's object driver. Each
// scenario mounts a themed tree, then times re-renders in which every measured
// primitive receives changed props, so none of them is retained. Results
// approximate the JavaScript render cost only: the object driver does not
// apply NativeScript properties or run layout. Run through Turbo:
//
//   bun run turbo run bench:render --filter=@octane-xplat/ui
//
// XPLAT_UI_BENCH_OUT=<file> appends one JSON line per scenario.
import { appendFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { expect, it, vi } from 'vitest'
import { createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { createNativeGestureContainer } from '../tests/native-gesture-object-driver'
import { createNativeGestureDriver } from '../tests/native-gesture-surface'

vi.mock('../src/gestures/native-surface', () => import('../tests/native-gesture-surface'))
vi.mock('@nativescript/core', async () => ({
  View: (await import('../tests/native-gesture-object-driver')).NativeGestureView,
  ScrollView: class {},
  isIOS: true,
  isAndroid: false,
  Application: {
    ios: true,
    android: false,
    on() {},
    off() {},
    addCss() {},
    systemAppearance: () => 'light',
  },
}))

import { Text } from '../src/components/content/Text.tsrx'
import { Pressable } from '../src/components/actions/Pressable.tsrx'
import { View } from '../src/components/layout/View.tsrx'
import { Grid } from '../src/components/layout/Grid.tsrx'
import { Theme } from '../src/theme/Theme.tsrx'
import { defineTheme } from '../src/theme/defined-theme'

const theme = defineTheme({ name: 'bench' })
const COUNT = 40
const WARMUP = Number(process.env.XPLAT_UI_BENCH_WARMUP ?? 30)
const SAMPLES = Number(process.env.XPLAT_UI_BENCH_SAMPLES ?? 150)
const indexes = Array.from({ length: COUNT }, (_, index) => index)

const CATEGORIES = ['Ocean', 'Forest', 'Desert', 'Tundra'] as const

function TextList(props: { tick: number }): unknown @{
  <Theme theme={theme}>
    <View>
      {indexes.map((index) => (
        <Text key={index} className="card-number">
          {String(props.tick + index)}
        </Text>
      ))}
    </View>
  </Theme>
}

function TypedTextList(props: { tick: number }): unknown @{
  <Theme theme={theme}>
    <View>
      {indexes.map((index) => (
        <Text key={index} type="supporting" maxLines={1}>
          {String(props.tick + index)}
        </Text>
      ))}
    </View>
  </Theme>
}

function PressableList(props: { tick: number }): unknown @{
  <Theme theme={theme}>
    <View>
      {indexes.map((index) => (
        <Pressable
          key={index}
          testID={`bench.item.${index}`}
          accessibilityLabel={`Sample ${props.tick + index}`}
          accessibilityState={{ selected: (props.tick + index) % 2 === 0 }}
          className="card"
          style={{ backgroundColor: (props.tick + index) % 2 ? '#fff' : '#eee' }}
          onPress={() => {}}
        />
      ))}
    </View>
  </Theme>
}

function ViewList(props: { tick: number }): unknown @{
  <Theme theme={theme}>
    <View>
      {indexes.map((index) => (
        <View key={index} testID={`bench.row.${props.tick + index}`} className="grid-row" />
      ))}
    </View>
  </Theme>
}

function GridList(props: { tick: number }): unknown @{
  <Theme theme={theme}>
    <View>
      {indexes.map((index) => (
        <Grid key={index} columns={2} id={`bench.grid.${props.tick + index}`} />
      ))}
    </View>
  </Theme>
}

/** The sandbox virtual grid's recycled row: a View with two Pressable cards,
 *  each holding three Texts. */
function CardRows(props: { tick: number }): unknown @{
  const rows = indexes.slice(0, COUNT / 4)
  const card = (number: number) => {
    const selected = number % 3 === 0
    const category = CATEGORIES[number % CATEGORIES.length]

    return (
      <Pressable
        testID={`grid.item.${number}`}
        accessibilityLabel={`Sample ${number}, ${category}`}
        accessibilityState={{ selected }}
        className="card"
        style={{ backgroundColor: '#fff', borderColor: selected ? '#214e44' : 'transparent' }}
        onPress={() => {}}
      >
        <Text className="card-category">{category}</Text>
        <Text className="card-number">{String(number).padStart(5, '0')}</Text>
        <Text className="card-state">{selected ? 'Selected' : 'Tap to select'}</Text>
      </Pressable>
    )
  }

  <Theme theme={theme}>
    <View>
      {rows.map((row) => (
        <View key={row} testID={`grid.row.${props.tick + row}`} className="grid-row">
          {card(props.tick * 2 + row * 2)}
          {card(props.tick * 2 + row * 2 + 1)}
        </View>
      ))}
    </View>
  </Theme>
}

interface Scenario {
  name: string
  component: (props: { tick: number }) => unknown
  /** Measured primitives re-rendered per update. */
  units: number
  unit: string
}

const scenarios: Scenario[] = [
  { name: 'text', component: TextList, units: COUNT, unit: 'Text' },
  { name: 'text-typed', component: TypedTextList, units: COUNT, unit: 'Text' },
  { name: 'pressable', component: PressableList, units: COUNT, unit: 'Pressable' },
  { name: 'view', component: ViewList, units: COUNT, unit: 'View' },
  { name: 'grid', component: GridList, units: COUNT, unit: 'Grid' },
  { name: 'card-row', component: CardRows, units: COUNT / 4, unit: 'row' },
]

const gc = (globalThis as { gc?: () => void }).gc

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
}

for (const scenario of scenarios) {
  it(`measures ${scenario.name}`, () => {
    const container = createNativeGestureContainer()
    const root = createUniversalRoot(container, createNativeGestureDriver(container))
    let tick = 0
    const update = () => flushUniversalSync(() => root.render(scenario.component, { tick: ++tick }))

    try {
      update()
      for (let index = 0; index < WARMUP; index++) {
        update()
      }

      gc?.()

      const samples: number[] = []

      for (let index = 0; index < SAMPLES; index++) {
        const start = performance.now()

        update()
        samples.push(((performance.now() - start) * 1000) / scenario.units)
      }

      samples.sort((a, b) => a - b)

      const result = {
        scenario: scenario.name,
        unit: scenario.unit,
        jitless: process.execArgv.includes('--jitless'),
        samples: SAMPLES,
        p50us: Number(percentile(samples, 50).toFixed(1)),
        p90us: Number(percentile(samples, 90).toFixed(1)),
      }

      console.log(`BENCH ${JSON.stringify(result)}`)
      if (process.env.XPLAT_UI_BENCH_OUT) {
        appendFileSync(process.env.XPLAT_UI_BENCH_OUT, `${JSON.stringify(result)}\n`)
      }

      expect(container.children.length).toBe(1)
    } finally {
      root.unmount()
    }
  })
}
