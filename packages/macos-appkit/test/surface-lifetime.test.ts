import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mockNativeBoundary } from './native-boundary.ts'

const hooks = mockNativeBoundary()
const { makeVideoView, updateVideoView, disposeVideoView } = await import('../src/video.ts')
const { AVPlayer, AVPlayerView, NSNotificationCenter, NSObject } =
  await import('@octane-xplat/platform/macos')

hooks.deregister()

function videoFixture() {
  const trace: string[] = []
  const callbacks: ((time: { seconds: number }) => void)[] = []
  const failures = new Map<string, Error>()
  let observer: any
  const run = (name: string) => {
    trace.push(name)
    if (failures.has(name)) {
      throw failures.get(name)
    }
  }

  Object.assign(NSObject.prototype, {
    init() {
      return this
    },
  })

  Object.assign(AVPlayerView.prototype, {
    initWithFrame() {
      return this
    },
  })

  Object.assign(AVPlayer.prototype, {
    init() {
      return this
    },
    addObserverForKeyPathOptionsContext(value: unknown) {
      observer = value
      run('player observe')
    },
    removeObserverForKeyPath() {
      run('player unobserve')
    },
    addPeriodicTimeObserverForIntervalQueueUsingBlock(
      interval: { value: number },
      _queue: unknown,
      callback: (time: { seconds: number }) => void,
    ) {
      assert.ok(interval.value > 0, 'CoreMedia requires a positive periodic interval')
      callbacks.push(callback)
      run('time observe')
      return {}
    },
    removeTimeObserver() {
      run('time unobserve')
    },
    replaceCurrentItemWithPlayerItem() {},
    pause() {
      run('pause')
    },
  })

  Object.assign(NSNotificationCenter.defaultCenter, {
    removeObserver() {
      run('notification unobserve')
    },
  })

  const view = makeVideoView()
  let calls = 0
  const node: any = {
    type: 'xplatvideo',
    lifecycle: 'live',
    view,
    props: {},
    container: {
      root: {
        eventScope(_kind, callback) {
          callback()
        },
      },
    },
  }

  const props = {
    observeCurrentTime: true,
    onCurrentTimeUpdated() {
      calls++
    },
    onPlaybackStart() {
      calls++
    },
  }

  updateVideoView(node, props)
  return {
    trace,
    callbacks,
    failures,
    node,
    view,
    props,
    observer: () => observer,
    calls: () => calls,
  }
}

test('video KVO resolves the observed player to its live surface owner', () => {
  const f = videoFixture()

  f.view.player.timeControlStatus = 2
  f.observer()['observeValueForKeyPath:ofObject:change:context:'](
    'timeControlStatus',
    f.view.player,
    null,
    null,
  )

  assert.equal(f.calls(), 1)
  disposeVideoView(f.view)
})

test('video retires held time callbacks and continues independent release after observer failure', () => {
  const f = videoFixture()

  f.callbacks[0]({ seconds: 1 })
  assert.equal(f.calls(), 1)

  const failure = Error('time observer release')

  f.failures.set('time unobserve', failure)
  assert.throws(
    () => disposeVideoView(f.view),
    (error) => error === failure,
  )

  assert.ok(f.trace.includes('player unobserve'))
  assert.ok(f.trace.includes('pause'))
  assert.equal(f.view.player, null)
  f.callbacks[0]({ seconds: 2 })
  assert.equal(f.calls(), 1)

  const count = f.trace.length

  disposeVideoView(f.view)
  assert.equal(f.trace.length, count)
})
