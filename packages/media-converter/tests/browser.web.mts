import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const server = await createServer({
  root,
  configFile: false,
  resolve: { extensions: ['.web.ts', '.ts', '.js'] },
  server: { host: '127.0.0.1', port: 0 },
})

let browser

try {
  await server.listen()
  browser = await chromium.launch()

  const page = await browser.newPage(),
    errors = []

  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${server.resolvedUrls.local[0]}tests/index.html`)

  const results = await page.evaluate(async () => {
    const { convertGif, releaseVideo, isAvailable } = await import('/src/index.web.ts')
    const { gifBytes } = await import('/tests/gif.mts')
    const input = URL.createObjectURL(new Blob([gifBytes()], { type: 'image/gif' }))
    const results = []

    try {
      for (const format of ['mp4', 'webm']) {
        if (!(await isAvailable(format))) {
          throw new Error(`${format} unavailable in Chromium fixture`)
        }

        const progress = []
        const job = convertGif(input, { format, onProgress: (value) => progress.push(value) })
        const result = await job.result
        const blob = await fetch(result.uri).then((response) => response.blob())
        const video = document.createElement('video')

        video.muted = true
        video.src = result.uri
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = resolve
          video.onerror = () => reject(new Error('Output video failed to decode'))
        })

        const canvas = document.createElement('canvas')

        canvas.width = 2
        canvas.height = 2

        const ctx = canvas.getContext('2d')
        const colors = []

        for (const time of [0.05, 0.2, 0.5]) {
          await new Promise((resolve) => {
            video.onseeked = resolve
            video.currentTime = time
          })

          ctx.drawImage(video, 0, 0)
          colors.push(Array.from(ctx.getImageData(0, 0, 1, 1).data))
        }

        const seconds = video.duration

        video.removeAttribute('src')
        video.load()
        releaseVideo(result)

        let revoked = false

        try {
          await fetch(result.uri)
        } catch {
          revoked = true
        }

        results.push({ format, ...result, bytes: blob.size, seconds, colors, progress, revoked })
      }

      const cancelled = convertGif(input, { onProgress: () => cancelled.cancel() })
      let abort = false

      try {
        await cancelled.result
      } catch (error) {
        abort = error.name === 'AbortError'
      }

      if (!abort) {
        throw new Error('Cancellation did not reject with AbortError')
      }

      let invalid = false

      try {
        await convertGif('data:image/png;base64,aGVsbG8=').result
      } catch {
        invalid = true
      }

      if (!invalid) {
        throw new Error('Non-GIF input was accepted')
      }
    } finally {
      URL.revokeObjectURL(input)
    }

    return results
  })

  for (const result of results) {
    assert.equal(result.duration, 600)
    assert.equal(result.width, 16)
    assert.equal(result.height, 16)
    assert.ok(Math.abs(result.seconds - 0.6) < 0.03, JSON.stringify(result))
    assert.ok(result.bytes > 100)
    assert.equal(result.revoked, true)
    assert.equal(result.progress.at(-1), 1)
    for (const color of result.colors.slice(0, 2)) {
      assert.ok(color[0] > 180 && color[2] < 80, JSON.stringify(result))
    }

    assert.ok(result.colors[2][2] > 180 && result.colors[2][0] < 80, JSON.stringify(result))
  }

  assert.deepEqual(errors, [])
  console.log(
    'Chromium: MP4/WebM decoded pixels, transparency, variable frame timing, cancellation, invalid input and output revocation passed; no visual analysis.',
  )
} finally {
  await browser?.close()
  await server.close()
}
