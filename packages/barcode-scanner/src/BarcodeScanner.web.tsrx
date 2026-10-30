/** @jsxImportSource @octane-xplat/jsx/dom */
import { useImperativeHandle, useEffect, useRef } from 'octane'
import type { BarcodeScannerHandle, BarcodeScannerProps } from './props'
import { fromDetectorFormat, toDetectorFormats } from './format-map.web'
import type { JSX } from 'octane/jsx-runtime'

/** Live barcode/QR scanner — getUserMedia + the BarcodeDetector API
 *  (Chromium/Safari 18.4+; Firefox lacks the detector). Polling runs on
 *  requestVideoFrameCallback where available, else a 250ms interval. */
export function BarcodeScanner(props: BarcodeScannerProps): JSX.Element @{
	const video = useRef<HTMLVideoElement | null>(null)
	const latest = useRef(props)
	latest.current = props

	const handle = (v: HTMLVideoElement | null): BarcodeScannerHandle => ({
		setPaused: () => {},
		toggleCamera: () => {},
		native: v,
	})

	useImperativeHandle(props.ref, () => handle(video.current), [])

	useEffect(() => {
		const Detector = (globalThis as any).BarcodeDetector
		const mediaDevices = (globalThis as any).navigator?.mediaDevices
		if (!Detector || typeof mediaDevices?.getUserMedia !== 'function') {
			props.onError?.({ message: 'unsupported: BarcodeDetector/getUserMedia is not available' })
			return
		}

		const el = video.current
		if (!el) {
			return
		}

		let detector: any
		try {
			detector = new Detector({ formats: toDetectorFormats(props.formats) })
		} catch {
			detector = new Detector()
		}

		let stream: MediaStream | null = null
		let timer: any = null
		let cancelled = false
		const pausedRef = { current: false }

		const poll = async () => {
			if (cancelled || !el || pausedRef.current) {
				return
			}

			try {
				const codes = await detector.detect(el)
				for (const code of codes ?? []) {
					const box = code.boundingBox
					latest.current.onCodeScanned?.({
						type: fromDetectorFormat(code.format),
						data: String(code.rawValue ?? ''),
						bounds: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : undefined,
					})
				}
			} catch {
				// A transient frame failure ends detection for this tick only.
			}

			schedule()
		}

		const schedule = () => {
			if (cancelled) {
				return
			}

			const rvfc = (el as any).requestVideoFrameCallback
			if (typeof rvfc === 'function') {
				rvfc.call(el, () => poll())
			} else {
				timer = setTimeout(poll, 250)
			}
		}

		// props.paused is read through latest in the poll loop.
		Object.defineProperty(pausedRef, 'current', {
			get: () => latest.current.paused ?? false,
		})

		mediaDevices
			.getUserMedia({
				video: { facingMode: props.facing === 'front' ? 'user' : 'environment' },
				audio: false,
			})
			.then((s: MediaStream) => {
				if (cancelled) {
					s.getTracks().forEach((t) => t.stop())
					return
				}

				stream = s
				el.srcObject = s
				el.play().catch(() => {})
				schedule()
			})
			.catch((e: any) => {
				latest.current.onError?.({ message: e?.message ?? 'camera unavailable' })
			})

		return () => {
			cancelled = true
			if (timer) {
				clearTimeout(timer)
			}

			stream?.getTracks().forEach((t) => t.stop())
			el.srcObject = null
		}
	}, [props.facing, JSON.stringify(props.formats)])

	<video
		ref={(el: HTMLVideoElement | null) => {
			video.current = el
		}}
		muted
		playsInline
		style={props.style}
		className={props.className}
	/>
}
