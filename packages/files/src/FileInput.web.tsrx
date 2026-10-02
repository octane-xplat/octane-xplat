import { useId, useRef, useState } from 'octane'
import { Field as FormField, Icon, Spinner as ActivityIndicator, Tooltip, useFieldControl } from '@octane-xplat/ui'
import type { FileInputFile, FileInputProps } from './props'
import { cx, formatFileSize, normalizePicked, validateFiles } from './file-input-utils'

const STATUS_GLYPHS = { error: '⚠', warning: '⚠', success: '✓' } as const

function FileInputControl(inputProps: FileInputProps) @{
	const { props } = useFieldControl(inputProps)
	const generatedId = useId()
	const inputId = props.id ?? generatedId
	const fileInput = useRef<HTMLInputElement | null>(null)

	const [dragging, setDragging] = useState(false)
	const [busy, setBusy] = useState(false)
	const [validationErrors, setValidationErrors] = useState<string[]>([])

	const files: FileInputFile[] = props.value == null ? [] : Array.isArray(props.value) ? props.value : [props.value]
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const canClear = files.length > 0 && !isDisabled && !isBusy
	const showsDisabledReason = isDisabled && !!props.disabledMessage
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
		// An optional custom picker can provide cloud or app-specific sources.
		if (props.pick) {
			Promise.resolve(props.pick({ accept: props.accept, multiple: props.isMultiple }))
				.then((r) => acceptRefs(normalizePicked(r)))
				.catch((error) => setValidationErrors([String(error?.message ?? error)]))
			return
		}

		fileInput.current?.click()
	}

	const handleFileSelect = (e: any) => {
		const list = e.target.files as any
		const picked: FileInputFile[] = []
		if (list) {
			for (let i = 0; i < list.length; i++) {
				const f = list[i]
				picked.push({ name: f.name, uri: URL.createObjectURL(f), size: f.size, mimeType: f.type, file: f })
			}
		}

		e.target.value = ''
		acceptRefs(picked)
	}

	const handleDrop = (e: any) => {
		e.preventDefault()
		e.stopPropagation()
		setDragging(false)
		if (isDisabled || isBusy) return
		const list = e.dataTransfer?.files
		if (!list?.length) return
		const picked: FileInputFile[] = []
		for (let i = 0; i < list.length; i++) {
			const f = list[i]
			picked.push({ name: f.name, uri: URL.createObjectURL(f), size: f.size, mimeType: f.type, file: f })
		}

		acceptRefs(picked)
	}

	const dropzone = props.mode === 'dropzone'
	const itemContent = (
		<>
			{files.length ? (
				<ul className="vx-fileinput-list">
					{files.map((f: FileInputFile, i: number) => (
						<li key={`${f.uri}-${i}`} className="vx-fileinput-item">
							<Icon name="xplat-upload" size={14} />
							<span className="vx-fileinput-itemname">{f.name}</span>
							{f.size != null ? <span className="vx-fileinput-itemsize">{formatFileSize(f.size)}</span> : null}
							{!isDisabled && !isBusy
								? <button type="button" className="vx-fileinput-itemremove" aria-label={`Remove ${f.name}`} onClick={() => removeAt(i)}>{'×'}</button>
								: null}
						</li>
					))}
				</ul>
			) : null}
			{dropzone ? (
				<div className="vx-fileinput-dropzone-hint">
					<Icon name="xplat-upload" size={24} />
					<span>{isDisabled ? 'Upload disabled' : 'Drag & drop files here or click to browse'}</span>
					{props.accept ? <span className="vx-fileinput-accept">{props.accept}</span> : null}
				</div>
			) : (
				<button
					type="button"
					id={inputId}
					className="vx-fileinput-trigger"
					disabled={isDisabled && !showsDisabledReason || undefined}
					aria-disabled={showsDisabledReason || undefined}
					aria-describedby={props.ariaDescribedBy}
					aria-required={props.isRequired && !props.isOptional || undefined}
					aria-invalid={statusType === 'error' || undefined}
					aria-busy={isBusy || undefined}
					onClick={pick}
				>
					<Icon name="xplat-upload" size={14} /> {files.length ? 'Choose more files' : 'Choose files'}
				</button>
			)}
			{dropzone ? (
				<button
					type="button"
					id={inputId}
					className="vx-fileinput-trigger vx-fileinput-trigger--hidden"
					disabled={isDisabled && !showsDisabledReason || undefined}
					aria-disabled={showsDisabledReason || undefined}
					aria-describedby={props.ariaDescribedBy}
					aria-required={props.isRequired && !props.isOptional || undefined}
					aria-invalid={statusType === 'error' || undefined}
					aria-busy={isBusy || undefined}
					onClick={pick}
				>
					Browse files
				</button>
			) : null}
			{canClear ? <button type="button" className="vx-fileinput-clear" aria-label={`Clear ${props.fieldLabel ?? props.label ?? 'files'}`} onClick={() => { setValidationErrors([]); fireChange([]) }}>{'×'}</button> : null}
			{isBusy ? <ActivityIndicator busy className="vx-fileinput-spinner" /> : null}
			{statusType ? (
				props.statusVariant === 'tooltip' && statusMessage
					? <Tooltip trigger={<span className={cx('vx-field-icon', `vx-field-icon--${statusType}`)}>{STATUS_GLYPHS[statusType]}</span>} content={statusMessage} />
					: <span className={cx('vx-field-icon', `vx-field-icon--${statusType}`)}>{STATUS_GLYPHS[statusType]}</span>
			) : null}
			{statusMessage && props.statusVariant !== 'tooltip'
				? <span className={cx('vx-field-status', `vx-field-status--${statusType}`)} role={statusType === 'error' ? 'alert' : 'status'}>{statusMessage}</span>
				: null}
			<input
				ref={(el: any) => { fileInput.current = el; if (!el) return; props.bind?.({ open: pick, native: el }) }}
				type="file"
				className="vx-fileinput-nativeinput"
				accept={props.accept}
				multiple={props.isMultiple || undefined}
				disabled={isDisabled || undefined}
				aria-hidden="true"
				tabIndex={-1}
				onChange={handleFileSelect}
			/>
		</>
	)

	<div
		className={cx(
			'vx-fileinput',
			dropzone && 'vx-fileinput--dropzone',
			isDisabled && 'vx-fileinput--disabled',
			isBusy && 'vx-fileinput--loading',
			dragging && 'vx-fileinput--dragging',
			statusType && `vx-fileinput--status-${statusType}`,
			props.size && `vx-fileinput--size-${props.size}`,
			props.className,
		)}
		style={props.style}
		onDragOver={(e: any) => { e.preventDefault(); if (!isDisabled && !isBusy) setDragging(true) }}
		onDragEnter={(e: any) => { e.preventDefault() }}
		onDragLeave={() => setDragging(false)}
		onDrop={handleDrop}
	>
		{itemContent}
	</div>
}

/**
 * File entry — `compact` (button + list) or `dropzone` mode. Values are
 * `{name, uri, size?, mimeType?}` portable refs. On web the hidden browser
 * input returns the `File` alongside its object URL. Drag/drop targets the
 * control wrapper in both modes.
 */
export function FileInput(props: FileInputProps) @{
	const { inField } = useFieldControl(props)
	const cid = useId()
	const control = <FileInputControl {...props} />
	if (inField) return control
	return (
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
	)
}
