/** Numeric pixel evidence, no image capture: scan the drawing buffer on a
 *  coarse grid and report what fraction of samples differ from the clear
 *  color — the share of canvas the model covers — plus the center/corner
 *  colors for spot checks. Shared — pure WebGL2 calls. */
export function readCoverage(gl: WebGL2RenderingContext, clear: readonly [number, number, number]): string {
  const w = gl.drawingBufferWidth
  const h = gl.drawingBufferHeight
  const step = 8
  const px = new Uint8Array(w * h * 4)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px)
  let model = 0
  let total = 0
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4
      const d = Math.abs(px[i] - clear[0]) + Math.abs(px[i + 1] - clear[1]) + Math.abs(px[i + 2] - clear[2])
      if (d > 24) {
        model++
      }
      total++
    }
  }
  const center = ((Math.floor(h / 2) * w + Math.floor(w / 2)) * 4)
  const hex = (i: number) => `#${px[i].toString(16).padStart(2, '0')}${px[i + 1].toString(16).padStart(2, '0')}${px[i + 2].toString(16).padStart(2, '0')}`
  const err = gl.getError()
  return `coverage=${((model / total) * 100).toFixed(0)}% center=${hex(center)} glErr=${err}`
}
