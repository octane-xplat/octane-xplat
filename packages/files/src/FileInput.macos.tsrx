/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useCallback, useMemo, useRef, useImperativeHandle, useId, useState, useLayoutEffect } from 'octane'
import type { NSView } from '@octane-xplat/platform/macos'
import { Field as FormField, Icon, Pressable, useFieldControl } from '@octane-xplat/ui'
import type { FileInputFile, FileInputProps } from './props'
import { files as fileService } from './files.macos'
import { createAppKitFileInputState } from './file-input-state.macos'
import { appKitFileInputDetails } from './file-input-details.macos'
import { appKitDroppedFiles } from './file-input-drop.macos'
import { cx, formatFileSize } from './file-input-utils'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const

function FileInputControl(inputProps: FileInputProps) @{
	const hostRef = useRef<NSView | null>(null)
	const { props } = useFieldControl(inputProps)
	const generatedId = useId()
	const inputId = props.id ?? generatedId

	const [busy, setBusy] = useState(false)
	const [validationErrors, setValidationErrors] = useState<string[]>([])

	const files: FileInputFile[] =
		props.value == null ? [] : Array.isArray(props.value) ? props.value : [props.value]

	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const statusType = validationErrors.length ? 'error' : props.status?.type
	const statusMessage = validationErrors.length ? validationErrors.join(' ') : props.status?.message

	const latest = useRef(props)
	latest.current = props
	const state = useMemo(() => createAppKitFileInputState({
		props: () => latest.current,
		pick: async (options) => {
			const picked = options.multiple ? await fileService.pickMultiple(options.accept) : await fileService.pick(options.accept)
			return Array.isArray(picked) ? picked.map((file) => appKitFileInputDetails(file, options.accept)) : picked ? appKitFileInputDetails(picked, options.accept) : null
		},
		publish: (pending, errors) => { setBusy(pending); setValidationErrors(errors) },
	}), [])
	const bind = useCallback((view: NSView | null) => {
		hostRef.current = view
		if (view) state.attach()
		else state.detach()
	}, [])

	const dropzone = props.mode === 'dropzone'
	const dropHost = useRef<NSView | null>(null), dropLease = useRef<(() => void) | null>(null)
	const bindDrop = useCallback((view: NSView | null) => {
		dropLease.current?.(); dropLease.current = null; dropHost.current = view
		const observe = (globalThis as any).__xplatAppKit?.observeFileDrop
		if (!view || typeof observe !== 'function') return
		const enabled = () => dropHost.current === view && Boolean(view.window) && state.canReceive()
		try { dropLease.current = observe(view, { enabled, receive: (uris: string[]) => {
			if (!enabled()) return false
			const picked = appKitDroppedFiles(uris, latest.current.accept)
			return enabled() && state.receive(picked)
		} }) } catch (error) { console.warn('[macos-file-drop] attachment unavailable', error) }
	}, [])
	useLayoutEffect(() => () => { dropHost.current = null; dropLease.current?.(); dropLease.current = null }, [])

	const statusText = statusType ? STATUS_TEXT[statusType] : null

	useImperativeHandle(props.ref, () => ({ open: state.open, get native() { return hostRef.current } }), [])

	<masonview
		ref={bindDrop}
		className={cx(
			'vx-fileinput',
			dropzone && 'vx-fileinput--dropzone',
			isDisabled && 'vx-fileinput--disabled',
			isBusy && 'vx-fileinput--loading',
			statusType && `vx-fileinput--status-${statusType}`,
			props.size && `vx-fileinput--size-${props.size}`,
			props.className,
		)}
		style={mergeStyle({ flexDirection: 'column' }, { display: 'flex', ...props.style })}
	>
		{files.length ? (
			<masonview
				className="vx-fileinput-list"
				style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
			>
				{files.map((f, i) => (
					<masonview
						key={`${f.uri}-${i}`}
						className="vx-fileinput-item"
						style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
					>
						<Icon name="xplat-upload" size={14} />
						<label className="vx-fileinput-itemname" text={f.name} />
						{f.size != null ? (
							<label className="vx-fileinput-itemsize" text={formatFileSize(f.size)} />
						) : null}
						{!isDisabled && !isBusy ? (
							<Pressable
								className="vx-fileinput-itemremove"
								accessibilityLabel={`Remove ${f.name}`}
								onPress={() => state.remove(f.uri)}
							>
								<label text="×" />
							</Pressable>
						) : null}
					</masonview>
				))}
			</masonview>
		) : null}
		<Pressable
			ref={bind}
			id={inputId}
			className="vx-fileinput-trigger"
			disabled={isDisabled || isBusy}
			accessibilityLabel={
				props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
			}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{ disabled: isDisabled, busy: isBusy } as any}
			onPress={state.open}
		>
			<masonview
				style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
			>
				<Icon name="xplat-upload" size={14} />
				<label text={files.length ? 'Choose more files' : 'Choose files'} />
			</masonview>
		</Pressable>
		{files.length > 0 && !isDisabled && !isBusy ? (
			<Pressable
				className="vx-fileinput-clear"
				accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'files'}`}
				onPress={state.clear}
			>
				<label text="×" />
			</Pressable>
		) : null}
		{statusText != null ? (
			<label
				className={cx('vx-field-icon', `vx-field-icon--${statusType}`)}
				text={statusText}
				accessibilityLabel={props.statusVariant === 'tooltip' ? statusMessage : undefined}
			/>
		) : null}
		{statusMessage && props.statusVariant !== 'tooltip' ? (
			<label
				className={cx('vx-field-status', `vx-field-status--${statusType}`)}
				text={statusMessage}
			/>
		) : null}
	</masonview>
}

/**
 * File entry — delegates selection to this package's AppKit files service.
 * Values are portable `{name, uri, size?, mimeType?}` refs. Both field presentations use
 * the matching renderer's local file-URL destination lease.
 */
export function FileInput(props: FileInputProps) @{
	const { inField } = useFieldControl(props)
	const cid = useId()
	const control = <FileInputControl {...props} />

	<>
		{inField ? (
			control
		) : (
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
