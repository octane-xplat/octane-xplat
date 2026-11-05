// Installed only by the explicit native development plugin. Serialize this fixed
// operation, never caller-provided expressions. It has no imports at runtime.
export function installDevInspector(inspectDOM) {
	const scope = globalThis as unknown as Record<string, any>
	const key = 'octane-xplat.dev-inspector'
	if (!scope.document || scope[key]) {
		return
	}
	const documentId = `doc_${scope.crypto.randomUUID()}`
	scope[key] = {
		version: 1,
		documentId,
		inspect(args) {
			const offset = args?.offset ?? 0
			const limit = args?.limit ?? 20
			const control = args?.control
			if (
				!args ||
				Object.keys(args).some((key) => !['offset', 'limit', 'control'].includes(key)) ||
				!Number.isSafeInteger(offset) ||
				offset < 0 ||
				!Number.isSafeInteger(limit) ||
				limit < 1 ||
				limit > 100 ||
				(control !== undefined &&
					(!control ||
						!['id', 'testID'].includes(control.kind) ||
						typeof control.name !== 'string' ||
						!control.name ||
						control.name.length > 256))
			) {
				return {
					error: { code: 'invalid_selection', message: 'Invalid named-host inspection request.' },
				}
			}
			// Inspection never focuses a control or dispatches input.
			const result = inspectDOM({ control, offset, limit, focus: false })
			return result.error ? result : { documentId, ...result }
		},
	}
}
