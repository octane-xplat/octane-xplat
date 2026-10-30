import { useEffect, useRef } from 'octane'
import {
	attachDevActionHandler,
	attachDevEffectHandler,
	devActionDeclarationKey,
	retainDevAction,
	type DevActionAvailability,
	type DevActionDefinition,
	type DevActionRun,
	type DevActionSpec,
	type DevEffectDefinition,
} from './dev-actions-registry'

type ReadyProbe = Exclude<DevActionAvailability['ready'], boolean | undefined>

/** Options for the useDevAction/useDevEffect hooks. */
export interface DevActionHookOptions {
	/** false detaches the handler without unmounting (e.g. an unfocused tab). Default true. */
	enabled?: boolean
	/** Owner name reported in failure records (e.g. the component name). */
	label?: string
}

/**
 * Declare a dev action inline and attach its handler while this component is
 * mounted. Several components may declare the same id; identical declarations
 * share one entry and the most recently mounted spec wins on conflicts. The
 * handler always runs the latest render's `run` closure.
 */
export function useDevAction(spec: DevActionSpec, options?: DevActionHookOptions): void {
	const enabled = options?.enabled !== false
	const label = options?.label
	const runRef = useRef(spec.run)
	runRef.current = spec.run
	const probe = spec.availability?.ready
	const probeFn = typeof probe === 'function' ? (probe as ReadyProbe) : undefined
	const probeRef = useRef(probeFn)
	probeRef.current = probeFn

	const { run: _run, availability, ...rest } = spec
	const declaration =
		typeof probe === 'function'
			? {
					...rest,
					availability: {
						...availability,
						ready: () => probeRef.current?.() ?? true,
					},
				}
			: { ...rest, ...(availability ? { availability } : {}) }

	const key = devActionDeclarationKey(declaration)

	useEffect(() => {
		if (!enabled) {
			return
		}

		const release = retainDevAction(declaration, key)
		const detach = attachDevActionHandler(
			spec.id,
			(input, context) => runRef.current(input, context),
			{ label },
		)

		return () => {
			detach()
			release()
		}
	}, [spec.id, enabled, label, key])
}

/**
 * Attach a handler to a shared dev action while this component is mounted.
 * When several components attach to one action, the most recently attached
 * handler runs.
 */
export function useDevActionHandler(
	action: DevActionDefinition,
	run: DevActionRun,
	options?: DevActionHookOptions,
): void {
	const enabled = options?.enabled !== false
	const label = options?.label
	const runRef = useRef(run)
	runRef.current = run
	useEffect(() => {
		if (!enabled) {
			return
		}

		return attachDevActionHandler(action, (input, context) => runRef.current(input, context), {
			label,
		})
	}, [action, enabled, label])
}

/** Attach a handler to a dev effect while this component is mounted; every attached handler runs per invocation. */
export function useDevEffect(
	effect: DevEffectDefinition,
	run: DevActionRun,
	options?: DevActionHookOptions,
): void {
	const enabled = options?.enabled !== false
	const label = options?.label
	const runRef = useRef(run)
	runRef.current = run
	useEffect(() => {
		if (!enabled) {
			return
		}

		return attachDevEffectHandler(effect, (input, context) => runRef.current(input, context), {
			label,
		})
	}, [effect, enabled, label])
}
