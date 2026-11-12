/** App-owned geometry for a uniformly scaled contain-fit player. All rectangles use logical units. */
export type VideoRect = { x: number; y: number; width: number; height: number }
export type VideoGeometrySpec = {
  overlay: VideoRect
  media: VideoRect
  thumbnailImage: VideoRect
  thumbnailClip: VideoRect
  radius: number
}
export type VideoPose = {
  x: number
  y: number
  scale: number
  clipPath: string
  image: VideoRect
  clip: VideoRect
}
type ViewportPose = { image: VideoRect; clip: VideoRect; radius: number }
export type VideoGeometry = {
  sample(progress: number): VideoPose
  rebase(next: VideoGeometrySpec, progress: number): VideoGeometry
}
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
const rectMix = (a: VideoRect, b: VideoRect, p: number): VideoRect => ({
  x: lerp(a.x, b.x, p),
  y: lerp(a.y, b.y, p),
  width: lerp(a.width, b.width, p),
  height: lerp(a.height, b.height, p),
})
const poseMix = (a: ViewportPose, b: ViewportPose, p: number): ViewportPose => ({
  image: rectMix(a.image, b.image, p),
  clip: rectMix(a.clip, b.clip, p),
  radius: lerp(a.radius, b.radius, p),
})
function contains(a: VideoRect, b: VideoRect) {
  return (
    b.x >= a.x - 0.001 &&
    b.y >= a.y - 0.001 &&
    b.x + b.width <= a.x + a.width + 0.001 &&
    b.y + b.height <= a.y + a.height + 0.001
  )
}

/** Build the example's geometry model; use the actual image mapping beneath the thumbnail crop. */
export function createVideoGeometry(spec: VideoGeometrySpec): VideoGeometry {
  return geometry(spec)
}
function geometry(
  spec: VideoGeometrySpec,
  anchor?: { progress: number; pose: ViewportPose },
): VideoGeometry {
  for (const rect of [spec.overlay, spec.media, spec.thumbnailImage, spec.thumbnailClip]) {
    if (!Object.values(rect).every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) {
      throw new Error('video transition: measure positive rectangles before opening')
    }
  }
  if (
    Math.abs(
      spec.thumbnailImage.width / spec.thumbnailImage.height - spec.media.width / spec.media.height,
    ) > 0.001
  ) {
    throw new Error('video transition: image mappings must preserve media aspect ratio')
  }
  if (
    !Number.isFinite(spec.radius) ||
    spec.radius < 0 ||
    !contains(spec.thumbnailImage, spec.thumbnailClip)
  ) {
    throw new Error('video transition: crop must remain inside the source image')
  }
  const closed: ViewportPose = {
    image: spec.thumbnailImage,
    clip: spec.thumbnailClip,
    radius: spec.radius,
  }
  const image = {
    ...spec.media,
    x: spec.media.x + spec.overlay.x,
    y: spec.media.y + spec.overlay.y,
  }
  const open: ViewportPose = { image, clip: image, radius: 0 }
  function viewport(progress: number): ViewportPose {
    const p = Math.max(0, Math.min(1, progress))
    if (!anchor) {
      return poseMix(closed, open, p)
    }
    return p <= anchor.progress
      ? poseMix(closed, anchor.pose, p / anchor.progress)
      : poseMix(anchor.pose, open, (p - anchor.progress) / (1 - anchor.progress))
  }
  return {
    sample(progress) {
      const current = viewport(progress)
      const scale = current.image.width / spec.media.width
      const centerX = spec.overlay.width / 2,
        centerY = spec.overlay.height / 2
      const x = current.image.x - spec.overlay.x - spec.media.x * scale - centerX * (1 - scale)
      const y = current.image.y - spec.overlay.y - spec.media.y * scale - centerY * (1 - scale)
      const left = (current.clip.x - spec.overlay.x - x - centerX * (1 - scale)) / scale
      const top = (current.clip.y - spec.overlay.y - y - centerY * (1 - scale)) / scale
      const right = spec.overlay.width - left - current.clip.width / scale
      const bottom = spec.overlay.height - top - current.clip.height / scale
      return {
        x,
        y,
        scale,
        image: current.image,
        clip: current.clip,
        clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round ${current.radius / scale}px)`,
      }
    },
    rebase(next, progress) {
      // Stable endpoints follow ordinary layout. An interrupted transition keeps
      // its displayed viewport pose and acquires the new two endpoints.
      return progress <= 0 || progress >= 1
        ? geometry(next)
        : geometry(next, { progress, pose: viewport(progress) })
    },
  }
}
