/** @jsxImportSource @octane-xplat/jsx */
import { useImperativeHandle, useCallback, useEffect, useRef } from 'octane'
import { isAndroid } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import { CameraPosition, DetectionType, MLKitView } from '@nativescript/mlkit-core'
import type { BarcodeScannerHandle, BarcodeScannerProps } from './props'
import { fromNativeFormat, toNativeFormats } from './format-map'

registerElement('xplatbarcodescanner', MLKitView)

function applyEscapeProps(view: any, props: BarcodeScannerProps): void {
	const bag = isAndroid ? props.android : props.ios
	if (bag) {
		Object.assign(view, bag)
	}
}

/** Live barcode/QR scanner — ML Kit's camera preview with `detectionType:
 *  barcode`. Decoding only; photo capture stays in @octane-xplat/camera. */
export function BarcodeScanner(props: BarcodeScannerProps) @{
	const host = useRef<MLKitView | null>(null)

	const bindHost = useCallback((v: MLKitView | null) => {
		host.current = v
	}, [])

	useImperativeHandle(
		props.ref,
		(): BarcodeScannerHandle => ({
			setPaused: (paused) => {
				if (host.current) {
					host.current.pause = paused
				}
			},
			toggleCamera: () => host.current?.toggleCamera(),
			native: host.current?.nativeViewProtected ?? host.current,
		}),
		[],
	)

	// Mount wiring — listeners before any prop assignment.
	useEffect(() => {
		const v = host.current
		if (!v) {
			return
		}

		v.detectionType = DetectionType.Barcode
		v.on(MLKitView.detectionEvent, (e: any) => {
			const data = e?.data ?? e?.data?.data ?? e
			const list = Array.isArray(data) ? data : [data]
			for (const item of list) {
				if (!item) {
					continue
				}

				const bounds = item.bounds
				props.onCodeScanned?.({
					type: fromNativeFormat(item.format),
					data: String(item.rawValue ?? item.displayValue ?? ''),
					bounds: bounds
						? {
								x: bounds.origin?.x ?? bounds.x ?? 0,
								y: bounds.origin?.y ?? bounds.y ?? 0,
								width: bounds.size?.width ?? bounds.width ?? 0,
								height: bounds.size?.height ?? bounds.height ?? 0,
							}
						: undefined,
				})
			}
		})

		applyEscapeProps(v, props)
	}, [])

	useEffect(() => {
		const v = host.current
		if (v) {
			v.barcodeFormats = toNativeFormats(props.formats)
		}
	}, [JSON.stringify(props.formats)])

	useEffect(() => {
		const v = host.current
		if (v) {
			v.cameraPosition = props.facing === 'front' ? CameraPosition.FRONT : CameraPosition.BACK
		}
	}, [props.facing])

	useEffect(() => {
		const v = host.current
		if (v) {
			v.pause = props.paused ?? false
		}
	}, [props.paused])

	useEffect(() => {
		const v = host.current
		if (v) {
			v.torchOn = props.torch ?? false
		}
	}, [props.torch])

	<xplatbarcodescanner ref={bindHost} style={props.style} className={props.className} />
}
