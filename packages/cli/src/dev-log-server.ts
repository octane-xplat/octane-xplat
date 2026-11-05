/** Shared wire validation for the retained HTTP bridge and native dev worker. */
export function formatBrowserLogBatch(body: unknown) {
	const input = body as { records?: unknown; dropped?: unknown } | null
	if (
		!input ||
		!Array.isArray(input.records) ||
		input.records.length > 10 ||
		!Number.isSafeInteger(input.dropped ?? 0) ||
		Number(input.dropped ?? 0) < 0 ||
		input.records.some(
			(record) =>
				!record ||
				!['warn', 'error'].includes(record.level) ||
				typeof record.line !== 'string' ||
				record.line.length > 2048,
		)
	) {
		throw new Error('Invalid browser log batch.')
	}

	let text = input.dropped
		? `[browser:warn] ${input.dropped} browser log records lost before delivery.\n`
		: ''
	for (const record of input.records) {
		for (const line of record.line.split(/\r?\n/)) {
			text += `[browser:${record.level}] ${line}\n`
		}
	}
	return { text, accepted: input.records.length }
}
