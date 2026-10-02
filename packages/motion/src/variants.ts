import { validateTarget } from './controller'
import { isOrchestrated, validateTransitionInput } from './engine'
import type { AnimationResult } from './engine'
import type { AnimationDefinition, Target, TransitionInput, Variants, VariantLabels } from './types'

export function isLabels(value: unknown): value is VariantLabels {
	return (
		typeof value === 'string' ||
		(Array.isArray(value) && value.every((label) => typeof label === 'string'))
	)
}

export function resolveVariant(
	definition: AnimationDefinition | false | undefined,
	variants?: Variants,
	custom?: any,
) {
	const target: Target = {}
	let transition: TransitionInput | undefined
	if (definition === undefined || definition === false) {
		return { target, transition }
	}

	const entries = isLabels(definition)
		? (typeof definition === 'string' ? [definition] : definition).map((label) =>
				Object.hasOwn(variants ?? {}, label) ? variants![label] : undefined,
			)
		: [definition]

	for (const entry of entries) {
		const resolved = typeof entry === 'function' ? entry(custom) : entry
		if (!resolved) {
			continue
		}

		const { transition: override, ...values } = resolved as Target & {
			transition?: TransitionInput
		}

		validateTarget(values)
		Object.assign(target, values)
		if (override !== undefined) {
			validateTransitionInput(override)
			transition = override
		}
	}

	return { target, transition }
}

/** Keep tree timing out of Controller and add inherited delay to every channel. */
export function playbackTransition(input: TransitionInput, delay = 0): TransitionInput {
	const {
		staggerChildren: _staggerChildren,
		delayChildren: _delayChildren,
		when: _when,
		...timing
	} = input

	if (isOrchestrated(timing)) {
		const result: TransitionInput = {
			default: { ...timing.default, delay: (timing.default?.delay ?? 0) + delay },
		}

		for (const [key, value] of Object.entries(timing)) {
			if (key !== 'default' && value) {
				result[key] = { ...value, delay: (value.delay ?? timing.default?.delay ?? 0) + delay }
			}
		}

		return result
	}

	return { ...timing, delay: (timing.delay ?? 0) + delay }
}

/** Root-local tree of inherited runs. Generations prevent queued work after replacement/disposal. */
export class VariantNode {
	readonly children = new Set<VariantNode>()
	private generation = 0
	private active?: {
		definition: AnimationDefinition
		finished: Promise<AnimationResult>
		generation: number
	}
	initial?: VariantLabels | false
	animate?: VariantLabels
	resolve!: (definition: AnimationDefinition) => { target: Target; transition: TransitionInput }
	play!: (
		definition: AnimationDefinition,
		target: Target,
		transition: TransitionInput,
	) => Promise<AnimationResult>
	stopOwn!: () => void

	register(child: VariantNode) {
		this.children.add(child)
		const active = this.active
		if (active && isLabels(active.definition)) {
			void active.finished.then((result) => {
				if (
					result !== 'finished' ||
					active.generation !== this.generation ||
					!this.children.has(child)
				) {
					return
				}

				const { transition } = this.resolve(active.definition)
				void child.run(
					active.definition,
					(transition.delayChildren ?? 0) +
						[...this.children].indexOf(child) * (transition.staggerChildren ?? 0),
				)
			})
		}

		return () => {
			this.children.delete(child)
			child.stop()
		}
	}

	/** Invalidate queued phases without stopping independently registered Presence exits. */
	cancelPending() {
		this.generation++
		for (const child of this.children) {
			child.cancelPending()
		}
	}

	stop() {
		this.generation++
		this.stopOwn?.()
		for (const child of this.children) {
			child.stop()
		}
	}

	run(definition: AnimationDefinition, delay = 0): Promise<AnimationResult> {
		this.animate = isLabels(definition) ? definition : undefined
		this.stop()
		const generation = this.generation
		const finished = this.runTree(definition, delay, generation)
		this.active = { definition, finished, generation }
		return finished
	}

	private async runTree(
		definition: AnimationDefinition,
		delay: number,
		generation: number,
	): Promise<AnimationResult> {
		const { target, transition } = this.resolve(definition)
		const participants = [...this.children]
		const own = () =>
			this.play(
				definition,
				target,
				playbackTransition(
					transition,
					transition.when === 'afterChildren' && participants.length && isLabels(definition)
						? 0
						: delay,
				),
			)

		const children = () =>
			Promise.all(
				isLabels(definition)
					? participants
							.filter((child) => this.children.has(child))
							.map((child, index) =>
								child.run(
									definition,
									(transition.when === 'beforeChildren' ? 0 : delay) +
										(transition.delayChildren ?? 0) +
										index * (transition.staggerChildren ?? 0),
								),
							)
					: [],
			)

		let results: AnimationResult[]
		if (transition.when === 'beforeChildren') {
			const result = await own()
			if (generation !== this.generation || result !== 'finished') {
				return 'cancelled'
			}

			results = [result, ...(await children())]
		} else if (transition.when === 'afterChildren') {
			results = await children()
			if (generation !== this.generation || results.some((result) => result !== 'finished')) {
				return 'cancelled'
			}

			results.push(await own())
		} else {
			const parent = own()
			const descendants = children()
			results = [await parent, ...(await descendants)]
		}

		return generation === this.generation && results.every((result) => result === 'finished')
			? 'finished'
			: 'cancelled'
	}
}
