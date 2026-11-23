/** @jsxImportSource @octane-xplat/jsx */
// Nonvisual real-player qualification. Supply motion-fixture.mp4 in the iOS
// App_Resources from packages/video/tests/fixtures/clip.mp4 (96x64).
// Run with the probe runner: --target ios --deps @octane-xplat/motion,@octane-xplat/video
// --resources <App_Resources root containing iOS/motion-fixture.mp4>.
// Native crop geometry and handler dispatch do not establish video pixels or OS input.
import { useState } from 'octane'
import { Video } from '@octane-xplat/video'
import type { VideoHandle } from '@octane-xplat/video'
import { Color } from '@nativescript/core'
import type { View } from '@nativescript/core'
import { VideoCropSurface } from '../../../examples/motion/video-crop-surface.tsrx'
import type { VideoCropControls } from '../../../examples/motion/video-crop-surface.tsrx'
import { createVideoGeometry } from '../../../examples/motion/video-geometry'
import type { VideoGeometrySpec, VideoRect } from '../../../examples/motion/video-geometry'
import { createGestureDispatch } from '../../../tools/probe/gesture-dispatch.mobile'
import type { ProbeContext } from '../../../tools/probe/context'

const original: VideoGeometrySpec = {
  overlay: { x: 0, y: 0, width: 300, height: 240 },
  media: { x: 0, y: 20, width: 300, height: 200 },
  thumbnailImage: { x: 20, y: 40, width: 150, height: 100 },
  thumbnailClip: { x: 35, y: 50, width: 100, height: 60 },
  radius: 12,
}

const resized: VideoGeometrySpec = {
  ...original,
  overlay: { x: 0, y: 0, width: 320, height: 260 },
  media: { x: 0, y: 70 / 3, width: 320, height: 640 / 3 },
  thumbnailImage: { x: 30, y: 50, width: 150, height: 100 },
  thumbnailClip: { x: 45, y: 60, width: 100, height: 60 },
}

let controls: VideoCropControls | undefined
let video: VideoHandle | null = null
let metadata = false
let closed = 0
let updateGeometry = (_next: VideoGeometrySpec) => {}
const saveControls = (next: VideoCropControls | undefined) => {
  controls = next
}

const saveVideo = (next: VideoHandle | null) => {
  video = next
}

function Player() @{
  const [geometry, setGeometry] = useState(original)

  updateGeometry = setGeometry

  const source = NSBundle.mainBundle.pathForResourceOfType('motion-fixture', 'mp4')

  if (!source) throw new Error('Bundle motion-fixture.mp4 in the probe iOS App_Resources')

  <masonview
    id="video-frame"
    style={{ width: geometry.overlay.width, height: geometry.overlay.height }}
  >
    <VideoCropSurface
      geometry={geometry}
      onControls={saveControls}
      onClosed={() => {
        closed++
      }}
    >
      <Video
        id="real-video"
        ref={saveVideo}
        src={source}
        controls={false}
        fit="contain"
        muted
        loop
        onReady={() => {
          metadata = true
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </VideoCropSurface>
  </masonview>
}

function Empty() @{
  <masonview />
}

function vectorBounds(layer: CALayer, x = 0, y = 0): VideoRect | undefined {
  const left = x + layer.frame.origin.x
  const top = y + layer.frame.origin.y

  if (layer.isKindOfClass(CAShapeLayer.class())) {
    // UIKit's class check establishes the bridge type; TypeScript cannot narrow it.
    const shape = layer as CAShapeLayer

    if (shape.path) {
      const box = CGPathGetPathBoundingBox(shape.path)

      return {
        x: left + box.origin.x,
        y: top + box.origin.y,
        width: box.size.width,
        height: box.size.height,
      }
    }
  }

  for (let i = 0; i < (layer.sublayers?.count ?? 0); i++) {
    const found = vectorBounds(layer.sublayers.objectAtIndex(i), left, top)

    if (found) {
      return found
    }
  }

  if (layer.mask) {
    return vectorBounds(layer.mask, left, top)
  }
}

const rect = (value: CGRect): VideoRect => ({
  x: value.origin.x,
  y: value.origin.y,
  width: value.size.width,
  height: value.size.height,
})

export async function run(ctx: ProbeContext) {
  const input = createGestureDispatch('y')
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  await ctx.mount(Player)
  await ctx.waitFor(() => metadata && video?.native?.isLoaded && controls, {
    timeout: 20000,
    interval: 20,
  })

  const frame: View = ctx.find('video-frame')
  const clip: View = ctx.find('real-video').parent
  const native = video!.native
  // The plugin exposes its UIView as .ios, not the owning controller.
  // Follow UIKit's public responder chain; never read its private controller field.
  let responder: UIResponder | null = native.ios

  while (responder && !responder.isKindOfClass(AVPlayerViewController.class())) {
    responder = responder.nextResponder
  }

  if (!responder) {
    throw new Error('The mounted video UIView has no AVPlayerViewController')
  }

  // UIKit's class check establishes the bridge type; TypeScript cannot narrow it.
  const playerView = responder as AVPlayerViewController
  const player = playerView.player

  ctx.onCleanup(() => {
    player.pause()
    input.restore()
  })

  let model = createVideoGeometry(original)
  const image = () => rect(playerView.view.convertRectToView(playerView.videoBounds, frame.ios))
  const crop = () => {
    const mask = clip.ios.layer.mask

    if (!mask) {
      throw new Error('Mounted video clip is missing the Mason mask')
    }

    const bounds = vectorBounds(mask)

    if (!bounds) {
      throw new Error('Mounted video mask has no vector geometry')
    }

    return rect(
      clip.ios.convertRectToView(
        CGRectMake(bounds.x, bounds.y, bounds.width, bounds.height),
        frame.ios,
      ),
    )
  }

  const near = (name: string, actual: VideoRect, expected: VideoRect) => {
    ctx.record(name, { actual, expected })
    ctx.assert(
      name,
      (['x', 'y', 'width', 'height'] as const).every(
        (key) => Math.abs(actual[key] - expected[key]) < 2,
      ),
      true,
    )
  }

  const progress = () => {
    const width = image().width
    let low = 0,
      high = 1

    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2

      if (model.sample(mid).image.width < width) {
        low = mid
      } else {
        high = mid
      }
    }

    return (low + high) / 2
  }

  await ctx.waitFor(() => playerView.videoBounds.size.width > 0, { timeout: 10000 })
  ctx.assert(
    'real AVPlayer item is ready',
    player.currentItem.status,
    AVPlayerItemStatus.ReadyToPlay,
  )

  near('closed player preserves thumbnail image mapping', image(), original.thumbnailImage)
  near('closed player preserves thumbnail crop', crop(), original.thumbnailClip)
  video!.play()
  await ctx.waitFor(() => video!.currentTime() > 50, { timeout: 10000 })
  ctx.assert('actual playback advances', player.rate > 0, true)

  controls!.open()
  await ctx.waitFor(() => image().width > 180 && image().width < 285, {
    timeout: 3000,
    interval: 5,
  })

  near('opening player follows intermediate geometry', image(), model.sample(progress()).image)
  near('opening real-player crop follows geometry', crop(), model.sample(progress()).clip)
  controls!.close()
  await ctx.waitFor(() => closed > 0, { timeout: 5000 })
  near('interrupted opening reverses to thumbnail', crop(), original.thumbnailClip)

  controls!.open()
  await ctx.waitFor(() => Math.abs(image().width - 300) < 0.01, { timeout: 5000 })
  await sleep(700)
  near('opened player uses contain-fit media rect', image(), model.sample(1).image)
  input.send(clip, 'start', 0)
  input.send(clip, 'move', 40)
  input.send(clip, 'move', 80)
  await ctx.waitFor(() => image().width < 290, { timeout: 3000 })
  await sleep(60)

  const heldProgress = progress()
  const beforeImage = image(),
    beforeCrop = crop()

  ctx.assert('drag owns an interior video pose', heldProgress > 0 && heldProgress < 1, true)
  model = model.rebase(resized, heldProgress)
  updateGeometry(resized)
  // The parent is untransformed; the clipped child's getActualSize() includes its scale.
  await ctx.waitFor(() => Math.abs(frame.getActualSize().width - 320) < 1, { timeout: 3000 })
  await sleep(80)
  near('resize during drag retains displayed video mapping', image(), beforeImage)
  near('resize during drag retains displayed crop', crop(), beforeCrop)
  clip.style.backgroundColor = new Color('#334455')
  clip.requestLayout()
  await sleep(80)
  near('same-size redraw retains the real-player crop', crop(), beforeCrop)
  input.send(clip, 'cancel', 80)
  await ctx.waitFor(() => Math.abs(image().width - 320) < 0.01, { timeout: 5000 })
  await sleep(700)
  near('drag cancellation restores resized open video', image(), model.sample(1).image)
  near('drag cancellation restores resized crop', crop(), model.sample(1).clip)
  controls!.close()
  await ctx.waitFor(() => closed > 1, { timeout: 5000 })
  near('resized reversal reaches the latest thumbnail', crop(), resized.thumbnailClip)

  controls!.open()
  await ctx.waitFor(() => image().width > 180 && image().width < 300, { timeout: 3000 })

  const closedBeforeUnmount = closed

  await ctx.mount(Empty)
  await sleep(150)
  ctx.assert('unmount releases transition controls', controls === undefined, true)
  ctx.assert(
    'unmount removes the real player host',
    native.parent == null || !native.isLoaded,
    true,
  )

  ctx.assert('unmount stops the actual player', player.rate, 0)
  ctx.record('unmount clip style', clip.style.clipPath ?? null)
  ctx.assert(
    'unmount clears the Motion clip lease',
    !clip.style.clipPath || clip.style.clipPath === 'none',
    true,
  )
  await sleep(1000)
  ctx.assert('unmount suppresses late endpoint callbacks', closed, closedBeforeUnmount)
}
