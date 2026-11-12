// Real-runtime regression case for the packaged iOS conversion engine.
// Runs inside a release-built NativeScript app on an owned simulator (driven
// by tests/ios-runtime.mts): exercises the public convertGif/releaseVideo
// contract, encoded-container verification, bounded worst-case frame work,
// cancellation while encoding, temporary-file ownership, and main-isolate
// responsiveness — written to qualify the retained TypeScript worker research
// engine (tests/converter-worker.ios.ts) and equally valid for the shipped
// Swift leaf.
import { Application, File, Label, Page, knownFolders, path } from '@nativescript/core'
import { convertGif, isAvailable, releaseVideo } from '@octane-xplat/media-converter'

// ImageIO/CoreVideo/CoreMedia C symbols absent from the bundled declarations.
declare function CGImageDestinationCreateWithURL(
  url: NSURL,
  type: string,
  count: number,
  options: NSDictionary<string, unknown> | null,
): unknown

declare function CGImageDestinationAddImage(
  destination: unknown,
  image: unknown,
  properties: NSDictionary<string, unknown> | null,
): void

declare function CGImageDestinationFinalize(destination: unknown): boolean
declare function CGBitmapContextCreateImage(context: unknown): unknown
declare function CMTimeGetSeconds(time: unknown): number
declare function CMSampleBufferGetPresentationTimeStamp(sample: unknown): unknown
declare function CMSampleBufferGetImageBuffer(sample: unknown): unknown
declare function CVPixelBufferGetDataSize(pixelBuffer: unknown): number
declare function CVPixelBufferLockBaseAddress(pixelBuffer: unknown, lockFlags: number): number
declare function CVPixelBufferUnlockBaseAddress(pixelBuffer: unknown, lockFlags: number): number
declare function CVPixelBufferGetBaseAddress(pixelBuffer: unknown): interop.Pointer | null
declare const kCVPixelBufferPixelFormatTypeKey: string

const folder = knownFolders.documents().path
const checks: string[] = []
const metrics: Record<string, unknown> = {}
const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message)
  }

  checks.push(message)
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const stage = (name: string) =>
  File.fromPath(path.join(folder, 'converter-stage.json')).writeTextSync(
    JSON.stringify({ stage: name, t: Date.now() }),
  )

const result = (error?: unknown) =>
  File.fromPath(path.join(folder, 'converter-result.json')).writeTextSync(
    JSON.stringify({
      passed: !error,
      checks,
      metrics,
      ...(error ? { error: String(error) } : {}),
    }),
  )

// Only xplat-video-* files directly inside the temporary directory are owned
// outputs; count them to prove teardown does not leak files.
const orphanOutputs = () => {
  const manager = NSFileManager.defaultManager
  const temp = String(manager.temporaryDirectory.path ?? '')
  const items = manager.contentsOfDirectoryAtPathError(temp)
  const names: string[] = []

  for (let index = 0; index < (items?.count ?? 0); index++) {
    const name = String(items!.objectAtIndex(index))

    if (name.startsWith('xplat-video-')) {
      names.push(name)
    }
  }

  return names
}

const GIF_B64 =
  'R0lGODlhEAAQAIEAAP8AAAAA/wAAAAD/ACH5BAQKAAIALAAAAAAQABAAAALBBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBQAh+QQNHgACACwAAAAAEAAQAAACwRRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFURRFUQUAIfkECBQAAgAsAAAAABAAEAAAAsEMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAFADs='

const options = (() => {
  const file = path.join(folder, 'converter-options.json')
  const defaults = { frames: 300, width: 2048, height: 2048, delayMs: 10 }

  try {
    if (File.exists(file)) {
      return { ...defaults, ...JSON.parse(File.fromPath(file).readTextSync()) }
    }
  } catch {
    // Fall through to defaults.
  }

  return defaults
})()

// Build a worst-case-in-caps GIF on device through ImageIO so the exact same
// encode surface (CGImageSource decode → AVAssetWriter) is measured end to end.
const writeBigGif = (
  file: string,
  frames: number,
  width: number,
  height: number,
  delayMs: number,
) => {
  const destination = CGImageDestinationCreateWithURL(
    NSURL.fileURLWithPath(file),
    'com.compuserve.gif',
    frames,
    null,
  )

  if (!destination) {
    throw new Error('Could not create GIF destination')
  }

  const context = CGBitmapContextCreate(
    null,
    width,
    height,
    8,
    width * 4,
    CGColorSpaceCreateDeviceRGB(),
    5 as CGBitmapInfo /* kCGImageAlphaInfoNoneSkipLast */,
  )

  if (!context) {
    throw new Error('Could not create frame context')
  }

  CGContextSetRGBFillColor(context, 0.15, 0.45, 0.85, 1)
  CGContextFillRect(context, CGRectMake(0, 0, width, height))

  const image = CGBitmapContextCreateImage(context)

  if (!image) {
    throw new Error('Could not render frame image')
  }

  const properties = {
    [kCGImagePropertyGIFDictionary]: { [kCGImagePropertyGIFDelayTime]: delayMs / 1000 },
  } as unknown as NSDictionary<string, unknown>

  for (let index = 0; index < frames; index++) {
    CGImageDestinationAddImage(destination, image, properties)
  }

  if (!CGImageDestinationFinalize(destination)) {
    throw new Error('Could not finalize GIF')
  }
}

const page = new Page()
const label = new Label()

label.text = 'media-converter worker checks'
page.content = label

let started = false

// The callback is async itself: rolldown release bundling strips the call
// parens off `void (async () => {…})()` inside a handler, which dropped the
// media-converter import — a build artifact, not a runtime limitation.
page.on(Page.loadedEvent, async () => {
  if (started) {
    return
  }

  started = true
  try {
    stage('start')
    for (const name of orphanOutputs()) {
      try {
        NSFileManager.defaultManager.removeItemAtPathError(
          path.join(String(NSFileManager.defaultManager.temporaryDirectory.path), name),
        )
      } catch {
        // Stale output from a previous run; best-effort sweep.
      }
    }

    const bytes = NSData.alloc().initWithBase64EncodedStringOptions(GIF_B64, 0)
    const source = path.join(folder, 'source.gif')

    bytes.writeToFileAtomically(source, true)
    assert(await isAvailable('mp4'), 'mp4 availability through worker backend')
    assert(!(await isAvailable('webm')), 'webm stays unavailable on iOS')

    // Representative job: nonblocking UI, progress, encoded duration.
    let ticks = 0
    const ticker = setInterval(() => ticks++, 5)
    let progress = 0
    let startedAt = Date.now()
    const video = await convertGif(source, {
      onProgress: (value) => {
        progress = value
      },
    }).result

    const smallMs = Date.now() - startedAt

    clearInterval(ticker)
    assert(video.duration === 600, 'traversal duration preserved')
    assert(video.width === 16 && video.height === 16, 'output dimensions preserved')
    assert(video.mimeType === 'video/mp4', 'mp4 mime type')
    assert(progress === 1, 'progress reaches 1')
    assert(ticks > 10, `main isolate stayed responsive (ticks=${ticks})`)
    metrics.small = { ms: smallMs, ticks }

    const asset = AVURLAsset.alloc().initWithURLOptions(NSURL.URLWithString(video.uri), null)
    const seconds = CMTimeGetSeconds(asset.duration)

    assert(Math.abs(seconds - 0.6) < 0.05, `encoded duration ${seconds}s`)

    const reader = AVAssetReader.alloc().initWithAssetError(asset, null)
    const track = asset.tracksWithMediaType(AVMediaTypeVideo).objectAtIndex(0)
    const samples = AVAssetReaderTrackOutput.alloc().initWithTrackOutputSettings(track, {
      [kCVPixelBufferPixelFormatTypeKey]: 1111970369,
    })

    reader.addOutput(samples)
    assert(reader.startReading(), 'reader started')

    let frames = 0
    const times: number[] = []
    let sample

    while ((sample = samples.copyNextSampleBuffer())) {
      const time = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sample))

      times.push(time)
      frames++

      const pixel = CMSampleBufferGetImageBuffer(sample)

      CVPixelBufferLockBaseAddress(pixel, 1 /* kCVPixelBufferLock_ReadOnly */)

      const data = new Uint8Array(
        interop.bufferFromData(
          NSData.dataWithBytesLength(
            CVPixelBufferGetBaseAddress(pixel),
            CVPixelBufferGetDataSize(pixel),
          ),
        ),
      )

      CVPixelBufferUnlockBaseAddress(pixel, 0)

      const red = data[2]!
      const blue = data[0]!

      assert(
        time < 0.4 ? red > 180 && blue < 80 : blue > 180 && red < 80,
        `composited pixel at ${time}s (r=${red}, b=${blue})`,
      )
    }

    assert(frames === 3, `decoded ${frames} frames`)
    assert(
      Math.abs(times[1]! - 0.1) < 0.02 && Math.abs(times[2]! - 0.4) < 0.02,
      `frame times ${JSON.stringify(times)}`,
    )

    releaseVideo(video)
    assert(!File.exists(video.uri.replace('file://', '')), 'release removes output')
    assert(orphanOutputs().length === 0, 'temporary outputs cleaned after release')

    // Bounded worst-case job within the documented caps (≤1000 frames,
    // ≤4.2 Mpx, ≤64 MiB, ≤60 s traversal).
    stage('big-generate')

    const big = path.join(folder, 'big.gif')

    if (File.exists(big)) {
      NSFileManager.defaultManager.removeItemAtPathError(big)
    }

    startedAt = Date.now()
    writeBigGif(big, options.frames, options.width, options.height, options.delayMs)

    const bigBytes = Number(
      NSFileManager.defaultManager.attributesOfItemAtPathError(big)?.objectForKey('NSFileSize') ??
        0,
    )

    metrics.bigGenerate = { ms: Date.now() - startedAt, bytes: bigBytes }
    assert(bigBytes > 0 && bigBytes <= 64 * 1024 * 1024, `big fixture ${bigBytes} bytes in cap`)

    stage('big-encode')
    ticks = 0

    const bigTicker = setInterval(() => ticks++, 5)
    let bigProgress = 0

    startedAt = Date.now()

    const bigVideo = await convertGif(big, { onProgress: (value) => (bigProgress = value) }).result
    const bigMs = Date.now() - startedAt

    clearInterval(bigTicker)

    const expectedDuration = options.frames * options.delayMs

    assert(bigVideo.duration === expectedDuration, `big duration ${bigVideo.duration}`)
    assert(
      bigVideo.width === options.width + (options.width % 2) &&
        bigVideo.height === options.height + (options.height % 2),
      `big dimensions ${bigVideo.width}x${bigVideo.height}`,
    )

    assert(bigProgress === 1, `big progress ${bigProgress}`)
    assert(ticks > 10, `main isolate responsive during big job (ticks=${ticks})`)
    metrics.bigEncode = {
      ms: bigMs,
      ticks,
      frames: options.frames,
      width: options.width,
      height: options.height,
    }

    const bigAsset = AVURLAsset.alloc().initWithURLOptions(NSURL.URLWithString(bigVideo.uri), null)
    const bigSeconds = CMTimeGetSeconds(bigAsset.duration)

    assert(
      Math.abs(bigSeconds - expectedDuration / 1000) < 0.2,
      `big encoded duration ${bigSeconds}s`,
    )

    releaseVideo(bigVideo)
    assert(!File.exists(bigVideo.uri.replace('file://', '')), 'big release removes output')
    assert(orphanOutputs().length === 0, 'temporary outputs cleaned after big release')

    // Cancellation while the worker is backpressured/encoding.
    stage('cancel-encode')

    let seen = 0
    const job = convertGif(big, { onProgress: (value) => (seen = value) })

    while (seen === 0) {
      await wait(5)
    }

    startedAt = Date.now()
    job.cancel()

    let cancelled = ''

    try {
      await job.result
    } catch (error) {
      cancelled = (error as Error).name
    }

    metrics.cancelEncode = { ms: Date.now() - startedAt, progressAtCancel: seen }
    assert(cancelled === 'AbortError', `cancel during encode rejects AbortError (${cancelled})`)
    assert(orphanOutputs().length === 0, 'cancelled encode leaves no partial output')

    // Idle window lets the driver measure whether the terminated isolate
    // actually stopped (post-cancel CPU stays low) — observed, not asserted.
    stage('post-cancel')
    await wait(4000)

    // Cancel before the worker posts its output: the promise still rejects
    // AbortError; orphan count is reported (a straggler file is a gap, not
    // a hard failure — iOS purges the temp directory).
    const early = convertGif(big)

    early.cancel()
    cancelled = ''
    try {
      await early.result
    } catch (error) {
      cancelled = (error as Error).name
    }

    assert(cancelled === 'AbortError', `immediate cancel rejects AbortError (${cancelled})`)
    await wait(500)
    metrics.immediateCancelOrphans = orphanOutputs().length

    // Repeatability after the big job and cancels.
    const again = await convertGif(source).result

    assert(again.duration === 600 && again.width === 16, 'conversion works after big job')
    releaseVideo(again)
    assert(orphanOutputs().length === 0, 'no leaked outputs at end')

    stage('done')
    result()
  } catch (error) {
    result(error)
  }
})

Application.run({ create: () => page })
