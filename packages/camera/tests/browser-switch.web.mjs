import assert from 'node:assert/strict'

export async function liveSwitchConformance(page) {
  await page.evaluate(async () => {
    await window.session.dispose()
    const media = navigator.mediaDevices
    const original = media.getUserMedia.bind(media)
    window.switchSources = []
    window.switchMicrophones = []
    media.enumerateDevices = async () =>
      ['a', 'b'].map((id) => ({
        kind: 'videoinput',
        deviceId: id,
        label: id,
        groupId: '',
        toJSON() {
          return {}
        },
      }))
    media.getUserMedia = async (constraints) => {
      if (!constraints.video) {
        const stream = await original(constraints)
        window.switchMicrophones.push(...stream.getAudioTracks())
        return stream
      }
      const selection = constraints.video.deviceId?.exact ?? 'a'
      if (window.switchSources.length) {
        await new Promise((resolve) => setTimeout(resolve, 600))
      }
      if (window.failCamera === selection || window.failCamera === 'all') {
        throw new DOMException('Injected camera acquisition failure', 'NotReadableError')
      }
      const canvas = document.createElement('canvas')
      canvas.width = selection === 'b' ? 480 : 640
      canvas.height = selection === 'b' ? 640 : 480
      const context = canvas.getContext('2d')
      context.fillStyle = selection === 'b' ? 'blue' : 'red'
      context.fillRect(0, 0, canvas.width, canvas.height)
      const stream = canvas.captureStream(30)
      const track = stream.getVideoTracks()[0]
      track.getSettings = () => ({
        deviceId: selection,
        width: canvas.width,
        height: canvas.height,
        frameRate: 30,
      })
      const timer = setInterval(() => context.fillRect(0, 0, canvas.width, canvas.height), 33)
      const stop = track.stop.bind(track)
      track.stop = () => {
        clearInterval(timer)
        stop()
      }
      window.switchSources.push(track)
      return stream
    }
    navigator.storage.persisted = async () => true
    navigator.storage.persist = async () => true
    window.createTestSession({ camera: { deviceId: 'a' }, audio: true })
  })
  await page.click('#permission')
  await page.waitForFunction(() => window.permissionResult?.microphone === 'granted')
  await page.evaluate(() => window.attach())
  await page.waitForFunction(async () => (await window.session.capabilities()).available)
  assert.equal(
    await page.evaluate(
      async () => (await window.session.capabilities()).cameraSwitchDuringRecording,
    ),
    true,
  )
  await page.evaluate(() => {
    window.take = window.session.startRecording()
    window.switchStartedAt = performance.now()
  })
  await page.waitForFunction(() => window.take.state === 'recording')
  const unsupportedFacing = await page.evaluate(async () => {
    const media = navigator.mediaDevices
    const original = media.getSupportedConstraints.bind(media)
    try {
      media.getSupportedConstraints = () => ({ ...original(), facingMode: false })
      return await window.session.switchCamera('front').then(
        () => 'unexpected',
        (error) => error.kind,
      )
    } finally {
      media.getSupportedConstraints = original
    }
  })
  assert.equal(unsupportedFacing, 'unsupportedConfiguration')
  assert.equal(await page.evaluate(() => window.switchSources[0].readyState), 'live')
  await page.waitForTimeout(500)
  await page.evaluate(() => {
    window.originalTake = window.take
    window.flipping = window.session.switchCamera({ deviceId: 'b' })
    window.secondFlip = window.session.switchCamera({ deviceId: 'a' }).then(
      () => 'unexpected',
      (error) => error.kind,
    )
  })
  assert.equal(await page.evaluate(() => window.session.snapshot().switchingCamera), true)
  assert.equal(await page.evaluate(() => window.secondFlip), 'busy')
  assert.equal(
    await page.evaluate(() =>
      window.switchMicrophones.every((track) => track.readyState === 'live'),
    ),
    true,
  )
  await page.evaluate(() => window.flipping)
  assert.equal(await page.evaluate(() => window.session.snapshot().activeCamera.id), 'b')
  assert.equal(
    await page.evaluate(() => window.session.snapshot().attempt.configuration.cameraId),
    'a',
  )
  await page.waitForTimeout(500)
  await page.evaluate(() => window.session.switchCamera({ deviceId: 'a' }))
  await page.waitForTimeout(500)
  const result = await page.evaluate(async () => {
    const elapsedBeforeStop = window.take.elapsedMs
    const wallDurationMs = performance.now() - window.switchStartedAt
    const promise = window.take.stop()
    const outcome = await promise
    if (outcome.kind !== 'clip') {
      throw new Error(JSON.stringify(window.serialize(outcome)))
    }
    const handle = await window.session.openOutput(outcome.clip.output)
    const bytes = await fetch(handle.url).then((response) => response.blob())
    const { movieTimeline } = await import('/tests/browser/switch-timing.ts')
    const timeline = await movieTimeline(bytes)
    handle.release()
    return {
      elapsedBeforeStop,
      wallDurationMs,
      outcome,
      timeline,
      samePromise: promise === window.originalTake.completion,
      microphoneCount: window.switchMicrophones.length,
      starts: window.events.filter((e) => e.type === 'started').length,
      finishes: window.events.filter((e) => e.type === 'finished').length,
    }
  })
  console.log(
    'live camera switching, generated video and Chromium mock microphone:',
    JSON.stringify(result),
  )
  assert.equal(result.samePromise, true)
  assert.equal(result.starts, 1)
  assert.equal(result.finishes, 1)
  assert.equal(result.microphoneCount, 1)
  assert.equal(result.outcome.clip.hasAudio, true)
  assert.equal(result.outcome.clip.width, 640)
  assert.equal(result.outcome.clip.height, 480)
  const video = result.timeline.find((track) => track.type === 'video')
  const audio = result.timeline.find((track) => track.type === 'audio')
  assert.ok(video && audio)
  assert.equal(video.monotonic, true)
  assert.equal(audio.monotonic, true)
  assert.ok(audio.maxGap < 0.15, JSON.stringify(result.timeline))
  assert.ok(video.maxGap < 0.15, JSON.stringify(result.timeline))
  assert.ok(Math.abs(audio.first - video.first) < 0.15, JSON.stringify(result.timeline))
  assert.ok(Math.abs(audio.last - video.last) < 0.15, JSON.stringify(result.timeline))

  // Audio capture runs off the renderer thread. A bounded renderer stall
  // during acquisition may extend the held frame, but must not shift A/V clocks.
  await page.evaluate(() => {
    window.take = window.session.startRecording()
  })
  await page.waitForFunction(() => window.take.state === 'recording')
  await page.waitForTimeout(400)
  await page.evaluate(() => {
    window.flipping = window.session.switchCamera({ deviceId: 'b' })
  })
  await page.waitForTimeout(50)
  await page.evaluate(() => {
    const until = performance.now() + 400
    while (performance.now() < until) {
      // Deliberately block this isolated test page; do not suspend audio.
    }
  })
  await page.evaluate(() => window.flipping)
  await page.waitForTimeout(500)
  await page.evaluate(() => window.session.switchCamera({ deviceId: 'a' }))
  await page.waitForTimeout(400)
  const stalledTimeline = await page.evaluate(async () => {
    const outcome = await window.take.stop()
    if (outcome.kind !== 'clip') {
      throw new Error(JSON.stringify(window.serialize(outcome)))
    }
    const handle = await window.session.openOutput(outcome.clip.output)
    try {
      const bytes = await fetch(handle.url).then((response) => response.blob())
      const { movieTimeline } = await import('/tests/browser/switch-timing.ts')
      return await movieTimeline(bytes)
    } finally {
      handle.release()
    }
  })
  console.log('live switching with a 400 ms renderer stall:', JSON.stringify(stalledTimeline))
  const stalledVideo = stalledTimeline.find((track) => track.type === 'video')
  const stalledAudio = stalledTimeline.find((track) => track.type === 'audio')
  assert.ok(stalledVideo && stalledAudio)
  assert.equal(stalledVideo.monotonic, true)
  assert.equal(stalledAudio.monotonic, true)
  assert.ok(stalledAudio.maxGap < 0.15, JSON.stringify(stalledTimeline))
  assert.ok(
    Math.abs(stalledAudio.first - stalledVideo.first) < 0.15,
    JSON.stringify(stalledTimeline),
  )
  assert.ok(Math.abs(stalledAudio.last - stalledVideo.last) < 0.15, JSON.stringify(stalledTimeline))

  // A failed target is rolled back within the same active take.
  await page.evaluate(() => {
    window.failCamera = 'b'
    window.take = window.session.startRecording()
  })
  await page.waitForFunction(() => window.take.state === 'recording')
  await page.waitForTimeout(400)
  const restored = await page.evaluate(async () => {
    const issue = await window.session.switchCamera({ deviceId: 'b' }).then(
      () => 'unexpected',
      (error) => error.kind,
    )
    return {
      issue,
      state: window.take.state,
      camera: window.session.snapshot().activeCamera.id,
      microphoneLive: window.switchMicrophones[0].readyState,
    }
  })
  assert.deepEqual(restored, {
    issue: 'unavailable',
    state: 'recording',
    camera: 'a',
    microphoneLive: 'live',
  })
  assert.equal(await page.evaluate(async () => (await window.take.stop()).kind), 'clip')

  // A source can finish acquisition before the shared session resumes. Stop
  // in that window must retire it and recover the previously selected camera.
  await page.evaluate(() => {
    window.failCamera = undefined
    window.take = window.session.startRecording()
  })
  await page.waitForFunction(() => window.take.state === 'recording')
  await page.waitForTimeout(400)
  const uncommitted = await page.evaluate(async () => {
    window.acquiredBeforeStop = false
    window.afterSwitchAcquired = () => {
      window.acquiredBeforeStop = true
      window.take.stop()
    }
    try {
      const issue = await window.session.switchCamera({ deviceId: 'b' }).then(
        () => 'unexpected',
        (error) => error.kind,
      )

      const outcome = await window.take.completion
      return {
        issue,
        kind: outcome.kind,
        camera: window.session.snapshot().activeCamera.id,
        acquiredBeforeStop: window.acquiredBeforeStop,
      }
    } finally {
      window.afterSwitchAcquired = undefined
    }
  })
  assert.deepEqual(uncommitted, {
    issue: 'invalidState',
    kind: 'clip',
    camera: 'a',
    acquiredBeforeStop: true,
  })
  await page.waitForFunction(() => window.switchSources.at(-1).readyState === 'live')
  assert.equal(await page.evaluate(() => window.switchSources.at(-1).getSettings().deviceId), 'a')
  console.log(
    'stop after acquisition restores the prior browser camera:',
    JSON.stringify(uncommitted),
  )

  // Stop has priority over a pending acquisition, including late getUserMedia.
  await page.evaluate(() => {
    window.failCamera = undefined
    window.take = window.session.startRecording()
  })
  await page.waitForFunction(() => window.take.state === 'recording')
  await page.waitForTimeout(400)
  await page.evaluate(() => {
    window.flipResult = window.session.switchCamera({ deviceId: 'b' }).then(
      () => 'unexpected',
      (error) => error.kind,
    )
  })
  await page.waitForTimeout(50)
  assert.equal(await page.evaluate(async () => (await window.take.stop()).kind), 'clip')
  assert.equal(await page.evaluate(() => window.flipResult), 'invalidState')
  await page.waitForFunction(async () => (await window.session.capabilities()).available)
  await page.waitForFunction(
    () => window.switchSources.filter((track) => track.readyState === 'live').length === 1,
  )

  // If rollback fails too, finalize the previous content with requested audio.
  await page.evaluate(() => {
    window.take = window.session.startRecording()
  })
  await page.waitForFunction(() => window.take.state === 'recording')
  await page.waitForTimeout(500)
  await page.evaluate(() => {
    window.failCamera = 'all'
    window.flipResult = window.session.switchCamera({ deviceId: 'b' }).then(
      () => 'unexpected',
      (error) => error.kind,
    )
  })
  const partial = await page.evaluate(async () => {
    await window.flipResult
    const outcome = await window.take.completion
    return { ...outcome, warning: outcome.warning ? { ...outcome.warning } : undefined }
  })
  assert.equal(partial.kind, 'clip')
  assert.equal(partial.partial, true)
  assert.equal(partial.endReason, 'cameraUnavailable')
  assert.equal(partial.clip.hasAudio, true)
  assert.equal(partial.warning.operation, 'switchCamera')
  await page.evaluate(() => window.session.dispose())
}
