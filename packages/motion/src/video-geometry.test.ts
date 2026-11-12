import { expect, it } from 'vitest'
import { createVideoGeometry } from '../examples/video-geometry'
import type { VideoGeometrySpec } from '../examples/video-geometry'
const original: VideoGeometrySpec = {
  overlay: { x: 0, y: 0, width: 400, height: 800 },
  media: { x: 0, y: 200, width: 400, height: 400 },
  thumbnailImage: { x: 20, y: 40, width: 120, height: 120 },
  thumbnailClip: { x: 20, y: 60, width: 120, height: 80 },
  radius: 16,
}
it('preserves the actual thumbnail crop and keeps every intermediate crop within the image', () => {
  const model = createVideoGeometry(original)
  expect(model.sample(0).clip).toEqual(original.thumbnailClip)
  for (const p of [0, 0.1, 0.3, 0.5, 0.8, 1, 0.8, 0.2, 0]) {
    const pose = model.sample(p)
    expect(pose.clip.x).toBeGreaterThanOrEqual(pose.image.x - 0.001)
    expect(pose.clip.y).toBeGreaterThanOrEqual(pose.image.y - 0.001)
    expect(pose.clip.x + pose.clip.width).toBeLessThanOrEqual(
      pose.image.x + pose.image.width + 0.001,
    )
    expect(pose.clip.y + pose.clip.height).toBeLessThanOrEqual(
      pose.image.y + pose.image.height + 0.001,
    )
  }
})
it('rebases an interrupted transition in viewport coordinates and can reverse to the new thumbnail', () => {
  const model = createVideoGeometry(original),
    shown = model.sample(0.4)
  const next: VideoGeometrySpec = {
    ...original,
    overlay: { x: 10, y: 30, width: 600, height: 900 },
    media: { x: 0, y: 150, width: 600, height: 600 },
    thumbnailImage: { x: 40, y: 80, width: 180, height: 180 },
    thumbnailClip: { x: 40, y: 110, width: 180, height: 120 },
  }
  const rebased = model.rebase(next, 0.4)
  expect(rebased.sample(0.4).image).toEqual(shown.image)
  expect(rebased.sample(0.4).clip).toEqual(shown.clip)
  expect(rebased.sample(0).clip).toEqual(next.thumbnailClip)
  expect(rebased.sample(1).image).toEqual({ x: 10, y: 180, width: 600, height: 600 })
})
