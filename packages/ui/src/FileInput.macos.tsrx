/** @jsxImportSource @xplat/macos/renderer */
import { useContext, useId, useState } from 'octane'
import type { FileInputFile, FileInputProps } from './props'
import { cx } from './cx'
import { Icon } from './Icon.macos.tsrx'
import { Pressable } from './Pressable.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { formatFileSize, getFilePicker, normalizePicked, validateFiles } from './file-picker'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const

function FileInputControl(inputProps: FileInputProps) @{
	const props = useFieldControlProps(inputProps)
	const generatedId = useId()
	const inputId = props.id ?? generatedId

	const [busy, setBusy] = useState(false)
	const [validationErrors, setValidationErrors] = useState<string[]>([])

	const files: FileInputFile[] = props.value == null ? [] : Array.isArray(props.value) ? props.value : [props.value]
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const statusType = validationErrors.length ? 'error' : props.status?.type
	const statusMessage = validationErrors.length ? validationErrors.join(' ') : props.status?.message

	// `onChange` mirrors `value`'s shape: array when `isMultiple`, single ref
	// or null otherwise.
	const emitValue = (next: FileInputFile[]): FileInputFile | FileInputFile[] | null =>
		props.isMultiple ? next : (next[0] ?? null)

	const fireChange = (next: FileInputFile[]) => {
		const emitted = emitValue(next)
		props.onChange?.(emitted)
		if (props.changeAction) {
			setBusy(true)
			Promise.resolve(props.changeAction(emitted)).finally(() => setBusy(false))
		}
	}

	const acceptRefs = (picked: FileInputFile[]) => {
		if (isDisabled || isBusy || !picked.length) return
		const merged = props.isMultiple ? [...files, ...picked] : picked
		const { valid, errors } = validateFiles(merged, {
			accept: props.accept,
			maxSize: props.maxSize,
			maxFiles: props.maxFiles,
		})

		setValidationErrors(errors)
		const next = !props.isMultiple && errors.length ? files : valid
		if (next.length !== files.length || next.some((file, index) => file.uri !== files[index]?.uri)) {
			fireChange(next)
		}
	}

	const removeAt = (index: number) => {
		if (isDisabled || isBusy) return
		setValidationErrors([])
		fireChange(files.filter((_, i) => i !== index))
	}

	const pick = () => {
		if (isDisabled || isBusy) return
		const provider = props.pick ?? getFilePicker()
		if (!provider) {
			setValidationErrors([
				'No file picker is registered — register an adapter for the app file service; multi-file selection needs a provider that returns arrays.',
			])

			return
		}

		Promise.resolve(provider({ accept: props.accept, multiple: props.isMultiple })).then((r) => acceptRefs(normalizePicked(r)))
	}

	const dropzone = props.mode === 'dropzone'
	const statusText = statusType ? STATUS_TEXT[statusType] : null

	<flexboxlayout
		flexDirection="column"
		className={cx(
			'vx-fileinput',
			dropzone && 'vx-fileinput--dropzone',
			isDisabled && 'vx-fileinput--disabled',
			isBusy && 'vx-fileinput--loading',
			statusType && `vx-fileinput--status-${statusType}`,
			props.size && `vx-fileinput--size-${props.size}`,
			props.className,
		)}
		style={props.style}
	>
		{files.length ? (
			<flexboxlayout flexDirection="column" className="vx-fileinput-list">
				{files.map((f, i) => (
					<flexboxlayout key={`${f.uri}-${i}`} flexDirection="row" alignItems="center" className="vx-fileinput-item">
						<Icon name="xplat-upload" size={14} />
						<label className="vx-fileinput-itemname" text={f.name} />
						{f.size != null ? <label className="vx-fileinput-itemsize" text={formatFileSize(f.size)} /> : null}
						{!isDisabled && !isBusy
							? <Pressable className="vx-fileinput-itemremove" accessibilityLabel={`Remove ${f.name}`} onPress={() => removeAt(i)}><label text="×" /></Pressable>
							: null}
					</flexboxlayout>
				))}
			</flexboxlayout>
		) : null}
		<Pressable
			bind={(v: any) => { if (!v) return; props.bind?.({ open: pick, native: v }) }}
			id={inputId}
			className="vx-fileinput-trigger"
			disabled={isDisabled || isBusy}
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{ disabled: isDisabled, busy: isBusy } as any}
			onPress={pick}
		>
			<flexboxlayout flexDirection="row" alignItems="center">
				<Icon name="xplat-upload" size={14} />
				<label text={files.length ? 'Choose more files' : 'Choose files'} />
			</flexboxlayout>
		</Pressable>
		{files.length > 0 && !isDisabled && !isBusy
			? <Pressable className="vx-fileinput-clear" accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'files'}`} onPress={() => { setValidationErrors([]); fireChange([]) }}><label text="×" /></Pressable>
			: null}
		{statusText != null
			? <label className={cx('vx-field-icon', `vx-field-icon--${statusType}`)} text={statusText} accessibilityLabel={props.statusVariant === 'tooltip' ? statusMessage : undefined} />
			: null}
		{statusMessage && props.statusVariant !== 'tooltip'
			? <label className={cx('vx-field-status', `vx-field-status--${statusType}`)} text={statusMessage} />
			: null}
	</flexboxlayout>
}

/**
 * File entry — on macOS `@octane-xplat/files` does not implement picking,
 * so the trigger only becomes active when an app registers a provider via
 * `registerFilePicker`/`pick`; without one the control renders its state
 * (list, clear, validation) and reports the missing provider on tap.
 * Values are `FileInputFile` `{name, uri, size?, mimeType?}` — the portable
 * `@octane-xplat/files` shape. Drag/drop is not implemented on this leaf.
 */
export function FileInput(props: FileInputProps) @{
	const inField = useContext(FieldContext) != null
	const cid = useId()
	const control = <FileInputControl {...props} />

	<>
		{inField ? control : (
			<FormField
				inputID={props.id ?? cid}
				label={props.label}
				isLabelHidden={props.isLabelHidden}
				description={props.description}
				isDisabled={props.isDisabled}
				disabledMessage={props.disabledMessage}
				isReadOnly={props.isReadOnly}
				isLoading={props.isLoading}
				isRequired={props.isRequired}
				isOptional={props.isOptional}
				size={props.size}
				status={props.status}
				statusVariant={props.statusVariant}
				labelTooltip={props.labelTooltip}
				width={props.width}
			>
				{control}
			</FormField>
		)}
	</>
}
