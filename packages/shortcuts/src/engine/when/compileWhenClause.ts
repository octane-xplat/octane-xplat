import { compile } from '@casbin/expression-eval'
import type { CompiledWhenClause } from '../types/internal.js'

export function compileWhenClause(source: string): CompiledWhenClause {
	const evaluateRaw = compile(source) as (context: Record<string, unknown>) => unknown
	return {
		source,
		evaluate(context) {
			return !!evaluateRaw(context)
		},
	}
}
