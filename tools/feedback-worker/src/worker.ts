interface Env {
	FEEDBACK: D1Database
	FEEDBACK_RATE_LIMITER: RateLimit
}

const MAX_BODY_BYTES = 32 * 1024
const TEXT_LIMITS = {
	goal: 2000,
	expected: 4000,
	expectation_basis: 4000,
	actual: 8000,
	evidence: 8000,
	workaround: 4000,
} as const
const TARGETS = new Set(['web', 'ios', 'android', 'macos', 'linux', 'windows', 'unknown'])
const IMPACTS = new Set(['blocked', 'rework', 'investigation', 'surprise'])
const FIELDS = new Set([...Object.keys(TEXT_LIMITS), 'target', 'impact'])

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			...headers,
		},
	})
}

// Enforce the byte limit while reading, including requests without Content-Length.
async function readBody(request: Request): Promise<string | null> {
	if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
		await request.body?.cancel()
		return null
	}
	const reader = request.body?.getReader()
	if (!reader) {
		return ''
	}
	const chunks: Uint8Array[] = []
	let length = 0
	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) {
				break
			}
			length += value.byteLength
			if (length > MAX_BODY_BYTES) {
				await reader.cancel()
				return null
			}
			chunks.push(value)
		}
	} finally {
		reader.releaseLock()
	}
	const bytes = new Uint8Array(length)
	let offset = 0
	for (const chunk of chunks) {
		bytes.set(chunk, offset)
		offset += chunk.byteLength
	}
	return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)
}

function validate(value: unknown): string | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return 'The report must be a JSON object.'
	}
	const report = value as Record<string, unknown>
	if (Object.keys(report).some((key) => !FIELDS.has(key))) {
		return 'The report contains unsupported fields.'
	}
	for (const [field, limit] of Object.entries(TEXT_LIMITS)) {
		const text = report[field]
		if ((field === 'evidence' || field === 'workaround') && text === undefined) {
			continue
		}
		if (typeof text !== 'string' || !text.trim() || text.length > limit) {
			return `${field} must be a non-empty string of at most ${limit} characters.`
		}
	}
	if (typeof report.target !== 'string' || !TARGETS.has(report.target)) {
		return 'target must be web, ios, android, macos, linux, windows, or unknown.'
	}
	if (typeof report.impact !== 'string' || !IMPACTS.has(report.impact)) {
		return 'impact must be blocked, rework, investigation, or surprise.'
	}
	return null
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (new URL(request.url).pathname !== '/api/feedback') {
			return json(404, { error: 'not-found' })
		}
		if (request.method !== 'POST') {
			return json(405, { error: 'method-not-allowed' }, { allow: 'POST' })
		}
		const mediaType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
		if (mediaType !== 'application/json') {
			return json(415, { error: 'unsupported-media-type', detail: 'Use application/json.' })
		}
		try {
			// Cloudflare supplies this header. It is used only for rate limiting,
			// never written to D1; direct local requests share one fallback bucket.
			const key = request.headers.get('cf-connecting-ip') ?? 'local'
			const { success } = await env.FEEDBACK_RATE_LIMITER.limit({ key })
			if (!success) {
				return json(429, { error: 'rate-limited' }, { 'retry-after': '60' })
			}
		} catch {
			return json(503, { error: 'temporarily-unavailable' })
		}
		let value: unknown
		try {
			const body = await readBody(request)
			if (body === null) {
				return json(413, { error: 'report-too-large', max_bytes: MAX_BODY_BYTES })
			}
			value = JSON.parse(body)
		} catch {
			return json(400, { error: 'invalid-json' })
		}
		const detail = validate(value)
		if (detail) {
			return json(400, { error: 'invalid-report', detail })
		}
		const report = value as Record<string, string | undefined>
		const id = crypto.randomUUID()
		const createdAt = new Date().toISOString()
		try {
			const result = await env.FEEDBACK.prepare(
				`INSERT INTO feedback_observations
				(id, created_at, goal, expected, expectation_basis, actual, target, impact, evidence, workaround)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
				.bind(
					id,
					createdAt,
					report.goal,
					report.expected,
					report.expectation_basis,
					report.actual,
					report.target,
					report.impact,
					report.evidence ?? null,
					report.workaround ?? null,
				)
				.run()
			if (!result.success) {
				return json(503, { error: 'temporarily-unavailable' })
			}
		} catch {
			// Never log report text or database errors containing bound values.
			return json(503, { error: 'temporarily-unavailable' })
		}
		return json(201, { id, created_at: createdAt })
	},
}
