import type { FileInputFile, FileInputPick, FileInputProps } from './props'
import { normalizePicked, validateFiles } from './file-input-utils'

/** AppKit picker/save ownership. Native attachment and rendering stay in the leaf. */
export function createAppKitFileInputState(options: {
	props(): FileInputProps
	pick: FileInputPick
	publish(busy: boolean, errors: string[]): void
}) {
	let attached = false
	let active: symbol | null = null
	let errors: string[] = []
	const files = (props: FileInputProps): FileInputFile[] =>
		props.value == null ? [] : Array.isArray(props.value) ? props.value : [props.value]
	const owns = (token: symbol) => attached && active === token
	const blocked = (props: FileInputProps) => props.isDisabled || props.isReadOnly || props.isLoading
	const editable = (token: symbol) => owns(token) && !blocked(options.props())
	const report = (next: string[]) => {
		errors = next
		if (attached) options.publish(active !== null, errors)
	}
	const save = async (next: FileInputFile[], token: symbol) => {
		if (!editable(token)) return
		const props = options.props()
		const emitted = props.isMultiple ? next : next[0] ?? null
		props.onChange(emitted)
		if (owns(token)) await props.changeAction?.(emitted)
	}
	const ready = () => attached && !active && !blocked(options.props())
	const accept = async (result: FileInputFile[], token: symbol) => {
		if (!editable(token) || !result.length) return
		const props = options.props(), previous = files(props)
		const { valid, errors: invalid } = validateFiles(props.isMultiple ? [...previous, ...result] : result, props)
		report(invalid)
		const next = !props.isMultiple && invalid.length ? previous : valid
		if (next.length !== previous.length || next.some((file, index) => file.uri !== previous[index]?.uri)) await save(next, token)
	}
	const run = (action: (token: symbol) => Promise<void>) => {
		if (!ready()) return false
		const token = Symbol('file-input')
		active = token
		options.publish(true, errors)
		void (async () => {
			try { await action(token) }
			catch (error) {
				if (owns(token)) report([String(error instanceof Error ? error.message : error)])
			} finally {
				if (owns(token)) {
					active = null
					options.publish(false, errors)
				}
			}
		})()
		return true
	}
	return {
		attach() {
			attached = true
			options.publish(active !== null, errors)
		},
		detach() { attached = false; active = null },
		open() {
			run(async (token) => {
				const request = options.props()
				const result = await (request.pick ?? options.pick)({ accept: request.accept, multiple: request.isMultiple })
				await accept(normalizePicked(result), token)
			})
		},
		canReceive: ready,
		receive(picked: FileInputFile[]): boolean {
			if (!picked.length) return false
			return run((token) => accept(picked, token))
		},
		remove(uri: string) {
			run(async (token) => {
				const previous = files(options.props()), index = previous.findIndex((file) => file.uri === uri)
				if (index < 0) return
				report([])
				await save(previous.filter((_, i) => i !== index), token)
			})
		},
		clear() {
			run(async (token) => {
				if (!files(options.props()).length) return
				report([])
				await save([], token)
			})
		},
	}
}
