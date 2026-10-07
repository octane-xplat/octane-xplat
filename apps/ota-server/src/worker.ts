import { compareVersions } from './semver.ts'

export interface Env {
	BUNDLES: R2Bucket
}

// Shape of the channel pointer object stored at
// channels/<channel>/<platform>.json in the BUNDLES bucket. `url` is added by
// the worker at serve time so the same pointer works on every origin.
interface ChannelPointer {
	version: string
	sha256: string
	size: number
	minNativeVersion: string
	releasedAt?: string
}

const PLATFORMS = new Set(['ios', 'android'])
const CHANNEL_RE = /^[a-z0-9][a-z0-9-]{0,31}$/
const SHA256_RE = /^[0-9a-f]{64}$/

function json(body: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers)
	headers.set('content-type', 'application/json')
	headers.set('cache-control', 'no-store')
	return new Response(JSON.stringify(body), { ...init, headers })
}

function readPointer(raw: string): ChannelPointer | null {
	let pointer: ChannelPointer
	try {
		pointer = JSON.parse(raw)
	} catch {
		return null
	}

	if (
		typeof pointer.version !== 'string' ||
		!SHA256_RE.test(pointer.sha256) ||
		typeof pointer.size !== 'number' ||
		typeof pointer.minNativeVersion !== 'string' ||
		compareVersions(pointer.minNativeVersion, '0.0.0') === null
	) {
		return null
	}

	return pointer
}

async function manifest(request: Request, env: Env): Promise<Response> {
	const params = new URL(request.url).searchParams
	const platform = params.get('platform') ?? ''
	const channel = params.get('channel') ?? 'stable'
	const nativeVersion = params.get('nativeVersion')
	const currentVersion = params.get('currentVersion')

	if (!PLATFORMS.has(platform)) {
		return json({ error: 'bad-request', detail: 'platform must be ios or android' }, { status: 400 })
	}

	if (!CHANNEL_RE.test(channel)) {
		return json({ error: 'bad-request', detail: 'channel must match [a-z0-9-]{1,32}' }, { status: 400 })
	}

	if (nativeVersion !== null && compareVersions(nativeVersion, '0.0.0') === null) {
		return json({ error: 'bad-request', detail: 'nativeVersion must be numeric x.y.z' }, { status: 400 })
	}

	const key = `channels/${channel}/${platform}.json`
	const object = await env.BUNDLES.get(key)
	if (object === null) {
		return json({ error: 'no-release', channel, platform }, { status: 404 })
	}

	const pointer = readPointer(await object.text())
	if (pointer === null) {
		return json({ error: 'bad-pointer', detail: `${key} is not a valid channel pointer` }, { status: 502 })
	}

	if (currentVersion === pointer.version) {
		return json({ updateAvailable: false, reason: 'up-to-date', version: pointer.version })
	}

	if (nativeVersion !== null && compareVersions(nativeVersion, pointer.minNativeVersion) === -1) {
		return json({
			updateAvailable: false,
			reason: 'min-native-version',
			version: pointer.version,
			minNativeVersion: pointer.minNativeVersion,
		})
	}

	return json({
		updateAvailable: true,
		channel,
		platform,
		version: pointer.version,
		sha256: pointer.sha256,
		size: pointer.size,
		minNativeVersion: pointer.minNativeVersion,
		releasedAt: pointer.releasedAt ?? null,
		url: `${new URL(request.url).origin}/bundles/${pointer.sha256}`,
	})
}

async function bundle(request: Request, env: Env, sha256: string): Promise<Response> {
	if (!SHA256_RE.test(sha256)) {
		return json({ error: 'bad-request', detail: 'expected a 64-hex sha256' }, { status: 400 })
	}

	const key = `bundles/${sha256}`
	if (request.method === 'HEAD') {
		const head = await env.BUNDLES.head(key)
		return head === null
			? new Response(null, { status: 404 })
			: new Response(null, {
					headers: {
						etag: `"${sha256}"`,
						'content-length': String(head.size),
						'cache-control': 'public, max-age=31536000, immutable',
					},
				})
	}

	const object = await env.BUNDLES.get(key)
	if (object === null) {
		return json({ error: 'no-bundle', sha256 }, { status: 404 })
	}

	return new Response(object.body, {
		headers: {
			'content-type': 'application/zip',
			'content-length': String(object.size),
			etag: `"${sha256}"`,
			'cache-control': 'public, max-age=31536000, immutable',
		},
	})
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url)
		if (request.method === 'GET' && url.pathname === '/healthz') {
			return new Response('ok')
		}

		if (request.method === 'GET' && url.pathname === '/manifest') {
			return manifest(request, env)
		}

		const bundleMatch = /^\/bundles\/([0-9a-zA-Z]+)$/.exec(url.pathname)
		if ((request.method === 'GET' || request.method === 'HEAD') && bundleMatch) {
			return bundle(request, env, bundleMatch[1].toLowerCase())
		}

		return json({ error: 'not-found' }, { status: 404 })
	},
} satisfies ExportedHandler<Env>
