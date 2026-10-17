// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Oxlint JS plugin — xplat rules. Rule logic lives in xplat-rules.mjs so the
// same checks run on .tsrx through the companion pass (lint-tsrx.mjs);
// oxlint can't parse .tsrx on its own.
import { XPLAT_CHECKS } from './xplat-rules.ts'

const filenameOf = (context) =>
	context.filename ?? context.getFilename?.() ?? context.physicalFilename ?? ''

const wrap = (check) => ({
	meta: {
		type: 'problem',
		docs: { description: check.name },
		schema: [
			{
				type: 'object',
				properties: {
					exclude: { type: 'array', items: { type: 'string' } },
					allow: { type: 'array', items: { type: 'string' } },
					cssRoot: { type: 'string' },
				},
				additionalProperties: true,
			},
		],
	},
	create(context) {
		return {
			'Program:exit'(program) {
				const options = context.options?.[0]
				const filename = filenameOf(context)
				for (const v of check(program, context.sourceCode.text, filename, options)) {
					context.report({ node: v.node, message: v.message })
				}
			},
		}
	},
})

const rules = {}
for (const [name, check] of Object.entries(XPLAT_CHECKS)) {
	rules[name] = wrap(check)
}

export default {
	meta: { name: 'xplat' },
	rules,
}
