import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'

// Preset names getByName resolves at both pinned SDKs — pulsar-android 1.3.0
// (CompatibilityPresets.kt companion names) and pulsar-ios 1.4.0
// (PresetsWrapper mapper keys; lookup lowercases the input). Re-verify this
// inventory against upstream before accepting a Pulsar bump.
const UPSTREAM_PRESETS = new Set([
  'SystemSelection',
  'SystemImpactLight',
  'SystemImpactMedium',
  'SystemImpactHeavy',
  'SystemImpactSoft',
  'SystemImpactRigid',
  'SystemNotificationSuccess',
  'SystemNotificationWarning',
  'SystemNotificationError',
])

const loadLeaf = (globals: Record<string, unknown>) => {
  const source = readFileSync(new URL('../src/haptics.ts', import.meta.url), 'utf8')
    .replace(/import { Application, Utils } from '@nativescript\/core'\n/, '')
    .replace(/import { java } from '@octane-xplat\/platform\/android'\n/, '')
    .replace(/import type.*\n/, '')
    .replace(/declare const .*\n/g, '')
    .replace('export const', 'const')

  return vm.runInContext(
    `${stripTypeScriptTypes(source)}\ncreateHaptics()`,
    vm.createContext(globals),
  )
}

const javaStubs = () => ({
  util: {
    ArrayList: class {
      items: unknown[] = []
      add(item: unknown) {
        this.items.push(item)
      }
    },
  },
})

const androidGlobals = (activity: object | null) => {
  const applicationContext = { isActivity: false }
  const played: string[] = []
  const com = {
    swmansion: {
      pulsar: {
        Pulsar: class {
          context: any
          constructor(context: any) {
            this.context = context
          }
          hapticSupport() {
            return { name: () => 'STANDARD_SUPPORT' }
          }
          // Upstream builds PresetsWrapper(this, context as Activity, engine).
          getPresets() {
            if (!this.context.isActivity) {
              throw new TypeError('ClassCastException')
            }

            return {
              getByName: (name: string) =>
                UPSTREAM_PRESETS.has(name) ? { play: () => played.push(name) } : null,
            }
          }
          getRealtimeComposer() {
            return { set() {}, stop() {} }
          }
          getPatternComposer() {
            return { parsePattern() {}, play() {} }
          }
          stopHaptics() {}
        },
        types: {
          ValuePoint: class {
            at: number
            value: number
            constructor(at: number, value: number) {
              this.at = at
              this.value = value
            }
          },
          ContinuousPattern: class {
            amplitude: unknown
            frequency: unknown
            constructor(amplitude: unknown, frequency: unknown) {
              this.amplitude = amplitude
              this.frequency = frequency
            }
          },
          PatternData: class {
            continuous: unknown
            discrete: unknown
            constructor(continuous: unknown, discrete: unknown) {
              this.continuous = continuous
              this.discrete = discrete
            }
          },
          RealtimeComposerStrategy: { ENVELOPE_WITH_DISCRETE_PRIMITIVES: 1 },
        },
      },
    },
  }

  return {
    globals: {
      Application: { android: { foregroundActivity: activity ?? undefined } },
      Utils: { android: { getApplicationContext: () => applicationContext } },
      com,
      java: javaStubs(),
    },
    played,
  }
}

const iosGlobals = () => {
  const played: string[] = []
  // pulsar-ios 1.4.0 getByName lowercases the name then hits the mapper.
  const registered = new Set([...UPSTREAM_PRESETS].map((name) => name.toLowerCase()))

  return {
    globals: {
      Application: {},
      XplatPulsarBridge: class {
        isSupported() {
          return true
        }
        playPreset(name: string) {
          if (!registered.has(name.toLowerCase())) {
            return false
          }

          played.push(name)
          return true
        }
        playPattern() {
          return true
        }
        startRealtime() {}
        setRealtime() {}
        stopRealtime() {}
        stop() {}
      },
    },
    played,
  }
}

const presets = [
  'selection',
  'impact-light',
  'impact-medium',
  'impact-heavy',
  'success',
  'warning',
  'error',
] as const

test('Android presets resolve registered pulsar names', () => {
  const { globals, played } = androidGlobals({ isActivity: true })
  const engine = loadLeaf(globals)

  assert.equal(engine.capabilities().presets, true)
  for (const preset of presets) {
    assert.equal(engine.play(preset), true, preset)
  }

  assert.deepEqual(played, [
    'SystemSelection',
    'SystemImpactLight',
    'SystemImpactMedium',
    'SystemImpactHeavy',
    'SystemNotificationSuccess',
    'SystemNotificationWarning',
    'SystemNotificationError',
  ])
})

test('Android application-context engine reports presets unsupported', () => {
  const { globals } = androidGlobals(null)
  const engine = loadLeaf(globals)
  const capabilities = engine.capabilities()

  assert.equal(capabilities.supported, true)
  assert.equal(capabilities.presets, false)
  assert.equal(capabilities.patterns, true)
  assert.equal(capabilities.realtime, true)
  assert.equal(engine.play('success'), false)
  // Pattern and realtime paths need only a Context — they keep working.
  assert.equal(engine.playPattern({ duration: 100, points: [{ at: 0, intensity: 1 }] }), true)
})

test('iOS presets resolve registered pulsar names', () => {
  const { globals, played } = iosGlobals()
  const engine = loadLeaf(globals)

  assert.equal(engine.capabilities().presets, true)
  for (const preset of presets) {
    assert.equal(engine.play(preset), true, preset)
  }

  assert.deepEqual(played, [
    'SystemSelection',
    'SystemImpactLight',
    'SystemImpactMedium',
    'SystemImpactHeavy',
    'SystemNotificationSuccess',
    'SystemNotificationWarning',
    'SystemNotificationError',
  ])
})
