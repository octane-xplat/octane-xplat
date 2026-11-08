import { readFileSync } from 'node:fs'
import {
  createWebHandler,
  createWebRenderer,
  manifestAssets,
  type WebAssetManifest,
} from '@octane-xplat/web-host/server'
import { App, catalog, requestContext } from './routes.web.tsrx'
import { Document } from './Document.web.tsrx'

// The client build's manifest maps the entry to this build's hashed files.
const manifest: WebAssetManifest = JSON.parse(
  readFileSync(new URL('../client/.vite/manifest.json', import.meta.url), 'utf8'),
)
const assets = manifestAssets(manifest, 'example/client.web.ts')

export const handle = createWebHandler({
  catalog,
  context: requestContext,
  buildId: 'example-v1',
  App,
  Document,
  assets,
  transfer: (match) => ({
    data: match.contract === 'declared' ? (match.data ?? null) : null,
    context: {},
  }),
  mode: (request) => (new URL(request.url).searchParams.has('client') ? 'client' : 'server'),
  response: (match) => (match.to === '/*' ? { status: 404 } : {}),
})

// Static output is a separate opt-in; request-time responses remain private by default.
export const staticRenderer = createWebRenderer({
  catalog,
  context: requestContext,
  buildId: 'example-v1',
  App,
  Document,
  assets,
  transfer: (match) => ({
    data: match.contract === 'declared' ? (match.data ?? null) : null,
    context: {},
  }),
  response: (match) => ({
    ...(match.to === '/*' ? { status: 404 } : {}),
    headers: { 'Cache-Control': 'public, max-age=60' },
  }),
})
