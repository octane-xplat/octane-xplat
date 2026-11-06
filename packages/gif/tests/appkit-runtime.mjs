import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'

// Real AppKit/JSC host runtime check for the TypeScript animated-image
// surface: remote HTTP, absolute-file and data: source loads, replacement,
// failed loads, fit layout, window-attach animation gating and disposal. No
// panels, OS input or visual inspection; the fixture server is loopback only.
const repo = fileURLToPath(new URL('../../..', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'octane-gif-runtime-'))

// 16x12 and 32x24 multi-frame GIF fixtures (the same bytes the migration
// probes verified end-to-end).
const GIF_A =
  'R0lGODlhEAAMAPcfMQAAACQAAEgAAGwAAJAAALQAANgAAPwAAAAkACQkAEgkAGwkAJAkALQkANgkAPwkAABIACRIAEhIAGxIAJBIALRIANhIAPxIAABsACRsAEhsAGxsAJBsALRsANhsAPxsAACQACSQAEiQAGyQAJCQALSQANiQAPyQAAC0ACS0AEi0AGy0AJC0ALS0ANi0APy0AADYACTYAEjYAGzYAJDYALTYANjYAPzYAAD8ACT8AEj8AGz8AJD8ALT8ANj8APz8AAAAVSQAVUgAVWwAVZAAVbQAVdgAVfwAVQAkVSQkVUgkVWwkVZAkVbQkVdgkVfwkVQBIVSRIVUhIVWxIVZBIVbRIVdhIVfxIVQBsVSRsVUhsVWxsVZBsVbRsVdhsVfxsVQCQVSSQVUiQVWyQVZCQVbSQVdiQVfyQVQC0VSS0VUi0VWy0VZC0VbS0Vdi0Vfy0VQDYVSTYVUjYVWzYVZDYVbTYVdjYVfzYVQD8VST8VUj8VWz8VZD8VbT8Vdj8Vfz8VQAAqiQAqkgAqmwAqpAAqrQAqtgAqvwAqgAkqiQkqkgkqmwkqpAkqrQkqtgkqvwkqgBIqiRIqkhIqmxIqpBIqrRIqthIqvxIqgBsqiRsqkhsqmxsqpBsqrRsqthsqvxsqgCQqiSQqkiQqmyQqpCQqrSQqtiQqvyQqgC0qiS0qki0qmy0qpC0qrS0qti0qvy0qgDYqiTYqkjYqmzYqpDYqrTYqtjYqvzYqgD8qiT8qkj8qmz8qpD8qrT8qtj8qvz8qgAA/yQA/0gA/2wA/5AA/7QA/9gA//wA/wAk/yQk/0gk/2wk/5Ak/7Qk/9gk//wk/wBI/yRI/0hI/2xI/5BI/7RI/9hI//xI/wBs/yRs/0hs/2xs/5Bs/7Rs/9hs//xs/wCQ/ySQ/0iQ/2yQ/5CQ/7SQ/9iQ//yQ/wC0/yS0/0i0/2y0/5C0/7S0/9i0//y0/wDY/yTY/0jY/2zY/5DY/7TY/9jY//zY/wD8/yT8/0j8/2z8/5D8/7T8/9j8//z8/yH/C05FVFNDQVBFMi4wAwEAAAAh+QQEMgAfACwAAAAAEAAMAAAIcwABADhwAMcxYMB+/MCBAx++f/8EEjx2MOFCHAceRhyIjyJChQwJQhTo0KPFkAcAbCxZESTGlCs7trxIUCVJmR9pwrxp0mXNmD11qjzw4cWPHTnw4MKHDlowYscOHTlw4YYPHgyXokMWbBjFIxIPBA2pMSAAIfkEBTIAAAAsAAAJABAAAgAACCIAT9zwoQMHHnz4sCETVuzYoQMPPvzoscMgroQLGx468iAgACH5BAUyAAAALAAACQAQAAIAAAghAH/0yIEDFz540IANM3bsyIELL37w0IEDz8GECxs+fBEQACH5BAUyAAAALAAACQAQAAIAAAghAHfkwIELHzpkwYgdO3TkwIcbP3jgwFMQHbSExhg6hBgQADs='

const GIF_B =
  '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'

const server = createServer((req, res) => {
  const url = req.url ?? '/'
  process.stderr.write(`[gif-serve] ${req.method} ${url}\n`)
  if (url === '/a.gif' || url === '/b.gif') {
    const body = Buffer.from(url === '/a.gif' ? GIF_A : GIF_B, 'base64')
    res.writeHead(200, { 'Content-Type': 'image/gif', 'Content-Length': body.length })
    res.end(body)
  } else {
    res.writeHead(404)
    res.end('missing')
  }
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port

try {
  const modules = join(directory, 'node_modules/@octane-xplat')
  await mkdir(modules, { recursive: true })
  for (const name of ['platform', 'gif']) {
    await symlink(join(repo, 'packages', name), join(modules, name), 'dir')
  }

  await writeFile(
    join(directory, 'package.json'),
    JSON.stringify({
      name: 'gif-appimage-runtime',
      private: true,
      type: 'module',
      // No dependencies declared: the leaf discovery must stay empty so
      // this check never compiles a native leaf — the TypeScript backend
      // needs only the prebuilt host and its metadata.
    }),
  )

  const caseFile = join(directory, 'case.ts')
  await writeFile(
    caseFile,
    `
import { NSOperationQueue, NSView, NSWindow, NSWorkspace } from '@octane-xplat/platform/macos'
import { createAnimatedImageView } from ${JSON.stringify(join(repo, 'packages/gif/src/animated-image-view.macos.ts'))}

let assertions = 0
const check = (value, name) => { assertions++; if (!value) throw new Error('ASSERT ' + name) }
const settled = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const untilInstalled = async (imageView, width, timeout = 10000) => {
	const deadline = Date.now() + timeout
	while (Date.now() < deadline) {
		const image = imageView.image
		if (image && Math.round(image.size.width) === width) return true
		await settled(25)
	}
	return false
}

setTimeout(async () => {
	try {
		const view = createAnimatedImageView()
		const imageView = view.subviews.objectAtIndex(0)
		check(view.isKindOfClass(NSView), 'created view is an NSView')
		check(imageView != null, 'image subview installed')
		check(Boolean(view.valueForKey('isFlipped')), 'isFlipped through ObjC dispatch')
		check(view.hitTest({ x: 1, y: 1 }) == null, 'hitTest never intercepts input')

		// Remote HTTP(S) source loads through the session delegate on the
		// pumped run loop — the lane that previously starved.
		view.setSource('http://127.0.0.1:${port}/a.gif')
		check(await untilInstalled(imageView, 16), 'remote gif A installs')
		check(Math.round(imageView.image.size.height) === 12, 'remote gif A is 16x12')
		check(imageView.animates === false, 'unattached view does not animate')
		check(
			Math.round(view.intrinsicContentSize.width) === 16 &&
				Math.round(view.intrinsicContentSize.height) === 12,
			'intrinsic size follows image',
		)

		view.setSource('http://127.0.0.1:${port}/b.gif')
		check(await untilInstalled(imageView, 32), 'remote gif B installs')
		check(Math.round(imageView.image.size.height) === 24, 'remote gif B is 32x24')

		// Failed remote load leaves the surface empty without faulting.
		view.setSource('http://127.0.0.1:${port}/missing.gif')
		await settled(800)
		check(imageView.image == null, '404 leaves surface empty')

		// Absolute file path and data: URI sources.
		view.setSource(${JSON.stringify('FILE_PATH_PLACEHOLDER')})
		check(await untilInstalled(imageView, 32), 'file path installs')
		view.setSource('data:image/gif;base64,R0lGODlhEAAMAPcfMQAAACQAAEgAAGwAAJAAALQAANgAAPwAAAAkACQkAEgkAGwkAJAkALQkANgkAPwkAABIACRIAEhIAGxIAJBIALRIANhIAPxIAABsACRsAEhsAGxsAJBsALRsANhsAPxsAACQACSQAEiQAGyQAJCQALSQANiQAPyQAAC0ACS0AEi0AGy0AJC0ALS0ANi0APy0AADYACTYAEjYAGzYAJDYALTYANjYAPzYAAD8ACT8AEj8AGz8AJD8ALT8ANj8APz8AAAAVSQAVUgAVWwAVZAAVbQAVdgAVfwAVQAkVSQkVUgkVWwkVZAkVbQkVdgkVfwkVQBIVSRIVUhIVWxIVZBIVbRIVdhIVfxIVQBsVSRsVUhsVWxsVZBsVbRsVdhsVfxsVQCQVSSQVUiQVWyQVZCQVbSQVdiQVfyQVQC0VSS0VUi0VWy0VZC0VbS0Vdi0Vfy0VQDYVSTYVUjYVWzYVZDYVbTYVdjYVfzYVQD8VST8VUj8VWz8VZD8VbT8Vdj8Vfz8VQAAqiQAqkgAqmwAqpAAqrQAqtgAqvwAqgAkqiQkqkgkqmwkqpAkqrQkqtgkqvwkqgBIqiRIqkhIqmxIqpBIqrRIqthIqvxIqgBsqiRsqkhsqmxsqpBsqrRsqthsqvxsqgCQqiSQqkiQqmyQqpCQqrSQqtiQqvyQqgC0qiS0qki0qmy0qpC0qrS0qti0qvy0qgDYqiTYqkjYqmzYqpDYqrTYqtjYqvzYqgD8qiT8qkj8qmz8qpD8qrT8qtj8qvz8qgAA/yQA/0gA/2wA/5AA/7QA/9gA//wA/wAk/yQk/0gk/2wk/5Ak/7Qk/9gk//wk/wBI/yRI/0hI/2xI/5BI/7RI/9hI//xI/wBs/yRs/0hs/2xs/5Bs/7Rs/9hs//xs/wCQ/ySQ/0iQ/2yQ/5CQ/7SQ/9iQ//yQ/wC0/yS0/0i0/2y0/5C0/7S0/9i0//y0/wDY/yTY/0jY/2zY/5DY/7TY/9jY//zY/wD8/yT8/0j8/2z8/5D8/7T8/9j8//z8/yH/C05FVFNDQVBFMi4wAwEAAAAh+QQEMgAfACwAAAAAEAAMAAAIcwABADhwAMcxYMB+/MCBAx++f/8EEjx2MOFCHAceRhyIjyJChQwJQhTo0KPFkAcAbCxZESTGlCs7trxIUCVJmR9pwrxp0mXNmD11qjzw4cWPHTnw4MKHDlowYscOHTlw4YYPHgyXokMWbBjFIxIPBA2pMSAAIfkEBTIAAAAsAAAJABAAAgAACCIAT9zwoQMHHnz4sCETVuzYoQMPPvzoscMgroQLGx468iAgACH5BAUyAAAALAAACQAQAAIAAAghAH/0yIEDFz540IANM3bsyIELL37w0IEDz8GECxs+fBEQACH5BAUyAAAALAAACQAQAAIAAAghAHfkwIELHzpkwYgdO3TkwIcbP3jgwFMQHbSExhg6hBgQADs=')
		check(await untilInstalled(imageView, 16), 'data URI installs')

		// Window attachment drives viewDidMoveToWindow -> animates (unless the
		// user's reduce-motion setting forbids it).
		const reduceMotion = Boolean(NSWorkspace.sharedWorkspace.accessibilityDisplayShouldReduceMotion)
		const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
			{ origin: { x: 0, y: 0 }, size: { width: 200, height: 100 } },
			0,
			2,
			false,
		)
		window.contentView.addSubview(view)
		check(imageView.animates === !reduceMotion, 'window attach starts animation')
		view.frame = { origin: { x: 0, y: 0 }, size: { width: 200, height: 100 } }
		view.layoutSubtreeIfNeeded()
		const fit = imageView.frame
		check(
			Math.abs(fit.size.height - 100) < 1 && Math.abs(fit.size.width - 16 * (100 / 12)) < 1,
			'aspectFit layout geometry',
		)
		view.hidden = true
		check(imageView.animates === false, 'hidden stops animation')
		view.hidden = false

		// Disposal: image cleared, animation off, late installs ignored.
		view.setSource('http://127.0.0.1:${port}/a.gif')
		view.dispose()
		await settled(800)
		check(imageView.image == null, 'dispose clears image')
		check(imageView.animates === false, 'dispose stops animation')
		check(imageView.superview != null, 'disposed view stays in hierarchy')
		view.setSource('http://127.0.0.1:${port}/b.gif')
		await settled(800)
		check(imageView.image == null, 'setSource after dispose is inert')
		window.close()

		console.log('GIF_APPIMAGE_RUNTIME_OK: ' + assertions + ' assertions; remote/file/data loads on pumped host')
	} catch (error) {
		console.error('GIF_APPIMAGE_RUNTIME_FAIL: ' + (error && error.message ? error.message + ' | ' + error.stack : error))
	} finally {
		globalThis.__xplatStopHost()
	}
}, 0)
`,
  )

  const fileFixture = join(directory, 'fixture-b.gif')
  await writeFile(fileFixture, Buffer.from(GIF_B, 'base64'))
  let source = await import('node:fs/promises').then((fs) => fs.readFile(caseFile, 'utf8'))
  await writeFile(
    caseFile,
    source.replace(JSON.stringify('FILE_PATH_PLACEHOLDER'), JSON.stringify(fileFixture)),
  )

  const artifact = await buildMacOSNative(directory)
  assert.deepEqual(artifact.leaves, [])
  const bootstrap = join(directory, 'bootstrap.js')
  await writeNativeBootstrap(artifact, bootstrap)

  await build({
    root: directory,
    configFile: false,
    logLevel: 'error',
    resolve: { conditions: ['macos'], extensions: ['.macos.ts', '.ts', '.js'] },
    build: {
      outDir: join(directory, 'dist'),
      target: 'es2022',
      lib: { entry: caseFile, formats: ['cjs'], fileName: () => 'case.cjs' },
      minify: false,
    },
  })

  const host = join(repo, 'packages/cli/src/macos/jsc-host/prebuilt/macos')
  // The host runs alongside this process's loopback fixture server, so it is
  // spawned asynchronously — spawnSync would starve the server mid-request.
  const result = await new Promise((resolve) => {
    const child = spawn(
      join(host, 'host'),
      [
        join(host, 'NativeScript.framework/Versions/A/NativeScript'),
        join(directory, 'dist/case.cjs'),
        artifact.metadata[process.arch === 'x64' ? 'x86_64' : 'arm64'],
        bootstrap,
      ],
      { timeout: 60_000 },
    )
    let output = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => (output += chunk))
    child.stderr.setEncoding('utf8').on('data', (chunk) => (output += chunk))
    child.on('close', (status) => resolve({ status, output }))
    child.on('error', (error) => resolve({ status: 1, output: String(error) }))
  })

  const output = result.output
  assert.equal(result.status, 0, output)
  assert.doesNotMatch(output, /GIF_APPIMAGE_RUNTIME_FAIL/)
  assert.match(output, /GIF_APPIMAGE_RUNTIME_OK/)
  console.log(output.trim())
  console.log(
    'Packaged-bundle profile, VoiceOver, WebP decode and visual animation remain unqualified.',
  )
} finally {
  server.close()
  if (process.env.GIF_TEST_KEEP_TMP) {
    console.log('kept ' + directory)
  } else {
    await rm(directory, { recursive: true, force: true })
  }
}
