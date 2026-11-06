import { existsSync } from 'node:fs'
import { SourceMap } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'

// Vite owns source maps and device rewriting. The native transport uses only
// already-served HTTP modules; the retained bridge can still transform modules
// and match the NativeScript device rewrite through its existing path.
export function createDevStackResolver(
  getServer,
  options: { cachedOnly?: boolean; origin?: string } = {},
) {
  // Matches `<http-url>:<line>:<col>` inside a stack frame — covers V8
  // `at fn (url:l:c)` / `at url:l:c` and JSC `fn@url:l:c`. Non-http
  // locations (e.g. `file:///app/bundle.mjs`) are ignored by construction.
  const HTTP_FRAME = /(https?:\/\/[^\s)"']+?):(\d+):(\d+)/g
  const FS_PREFIX = '/@fs'
  // NativeScript dev sessions serve device modules under /ns/m/<vite-url-path>;
  // the process-code-for-device rewrite injects preludes with no source map
  // and non-uniform line shifts, so device lines are mapped back by text.
  const NS_MODULE_PREFIX = '/ns/m/'
  const MAX_DEVICE_MODULE_BYTES = 5 * 1024 * 1024

  const transformFor = async (moduleUrl, cache) => {
    const viteServer = getServer()
    let entry = cache.get(moduleUrl)
    if (entry === undefined) {
      try {
        entry = options.cachedOnly
          ? (await viteServer.moduleGraph.getModuleByUrl(moduleUrl))?.transformResult
          : await viteServer.transformRequest(moduleUrl)
      } catch {
        entry = null
      }

      cache.set(moduleUrl, entry)
    }

    return entry
  }

  // The code the phone actually ran for one /ns/m/ URL, fetched from this
  // dev server exactly the way the device fetched it. Cached per resolveStack
  // call; a failed or oversized fetch just leaves the frame raw.
  const deviceCodeFor = async (pathname, search, origin, cache) => {
    const viteServer = getServer()
    const key = `device:${pathname}${search}`
    let code = cache.get(key)
    if (code === undefined) {
      code = null
      try {
        const base = viteServer.resolvedUrls?.local?.[0] ?? origin
        const res = await fetch(new URL(pathname + search, base))
        if (res.ok) {
          const body = await res.text()
          if (body.length <= MAX_DEVICE_MODULE_BYTES) {
            code = body
          }
        }
      } catch {
        // leave code null
      }

      cache.set(key, code)
    }

    return code
  }

  // @nativescript/vite anchors /ns/m/<rel> at the project root, or at the
  // monorepo workspace root for workspace packages outside it; mirror that by
  // taking the nearest ancestor of the vite root where the file exists.
  const deviceModuleUrl = (rel) => {
    const viteServer = getServer()
    if (rel.startsWith('@fs/') || existsSync(join(viteServer.config.root, rel))) {
      return `/${rel}`
    }

    for (let dir = dirname(viteServer.config.root); ; dir = dirname(dir)) {
      const abs = join(dir, rel)
      if (existsSync(abs)) {
        return `${FS_PREFIX}${abs.split(sep).join('/')}`
      }

      if (dirname(dir) === dir) {
        return `/${rel}`
      }
    }
  }

  const indent = (text) => text.length - text.trimStart().length

  // The NS device rewrite only adds lines, so the transformed twin of a
  // device line sits at or before the device index; a tie resolves to the
  // greatest index ≤ the device index, else the nearest match overall.
  const mapDevicePosition = (deviceCode, transformedCode, line0, col0) => {
    const deviceLines = deviceCode.split('\n')
    const transformedLines = transformedCode.split('\n')
    const text = deviceLines[line0]?.trim()
    if (!text || text.length < 8) {
      return undefined
    }

    let bestBefore = -1
    let nearest = -1
    let nearestDistance = Infinity
    for (let i = 0; i < transformedLines.length; i++) {
      if (transformedLines[i].trim() !== text) {
        continue
      }

      const distance = Math.abs(i - line0)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = i
      }

      if (i <= line0) {
        bestBefore = i
      }
    }

    const index = bestBefore >= 0 ? bestBefore : nearest
    if (index < 0) {
      return undefined
    }

    const col = Math.max(0, indent(transformedLines[index]) + (col0 - indent(deviceLines[line0])))
    return { line: index, col }
  }

  const resolveFrame = async (url, line, col, cache) => {
    const viteServer = getServer()
    const { origin, pathname, search } = new URL(url)
    if (options.origin && origin !== options.origin) {
      return undefined
    }
    if (!Number.isSafeInteger(line) || !Number.isSafeInteger(col) || line < 1 || col < 1) {
      return undefined
    }
    const isDeviceModule = pathname.startsWith(NS_MODULE_PREFIX)
    if (options.cachedOnly && isDeviceModule) {
      return undefined
    }
    const moduleUrl = isDeviceModule
      ? deviceModuleUrl(pathname.slice(NS_MODULE_PREFIX.length))
      : pathname + search
    const transformed = await transformFor(moduleUrl, cache)
    const map = transformed?.map
    if (!map || (options.cachedOnly && JSON.stringify(map).length > MAX_DEVICE_MODULE_BYTES)) {
      return undefined
    }

    let generatedLine = line - 1
    let generatedColumn = col - 1
    if (isDeviceModule) {
      const deviceCode = await deviceCodeFor(pathname, search, origin, cache)
      if (!deviceCode || !transformed.code) {
        return undefined
      }

      const mapped = mapDevicePosition(deviceCode, transformed.code, generatedLine, generatedColumn)
      if (!mapped) {
        return undefined
      }

      generatedLine = mapped.line
      generatedColumn = mapped.col
    }

    let sourceMap = cache.get(`map:${moduleUrl}`)
    if (!sourceMap) {
      sourceMap = new SourceMap(map)
      cache.set(`map:${moduleUrl}`, sourceMap)
    }

    const found = sourceMap.findEntry(generatedLine, generatedColumn)
    if (!found?.originalSource) {
      return undefined
    }

    // map.sources entries resolve against the transformed module's own
    // file — a clean filesystem path, no query. Falls back to the /@fs
    // path for out-of-root modules, root + pathname for in-root ones.
    const modulePath = isDeviceModule ? moduleUrl : pathname
    const mod = await viteServer.moduleGraph.getModuleByUrl(moduleUrl)
    const moduleId =
      mod?.file ??
      (modulePath.startsWith(FS_PREFIX)
        ? modulePath.slice(FS_PREFIX.length)
        : join(viteServer.config.root, modulePath))
    const original = found.originalSource
    const sourcePath = isAbsolute(original)
      ? original
      : resolve(
          dirname(moduleId),
          typeof map.sourceRoot === 'string' ? map.sourceRoot : '.',
          original,
        )
    const rootRelative = relative(viteServer.config.root, sourcePath).split(sep).join('/')
    return `${rootRelative}:${found.originalLine + 1}:${found.originalColumn + 1}`
  }

  // Rewrite every resolvable http(s) frame location to its original source
  // position; returns undefined when nothing resolved. Bounded to the
  // failure record itself — a transform failure leaves frames untouched.
  const resolveStack = async (stack) => {
    const cache = new Map()
    const parts: string[] = []
    let last = 0
    let changed = false
    let frames = 0
    for (const match of stack.matchAll(HTTP_FRAME)) {
      if (++frames > 64) {
        break
      }

      let resolved
      try {
        resolved = await resolveFrame(match[1], Number(match[2]), Number(match[3]), cache)
      } catch {
        // A malformed URL/map leaves this frame raw.
      }

      if (resolved && (!options.cachedOnly || resolved.length <= 8192)) {
        parts.push(stack.slice(last, match.index), resolved)
        last = match.index + match[0].length
        changed = true
      }
    }

    if (!changed) {
      return undefined
    }

    parts.push(stack.slice(last))
    const result = parts.join('')
    return options.cachedOnly && Buffer.byteLength(result) > 16 * 1024 ? undefined : result
  }

  return resolveStack
}
