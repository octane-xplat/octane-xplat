/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { composeStory } from 'storybook/preview-api'
import { findByTestId, mountXplat, waitUntil } from '@octane-xplat/platform/testing'
import { Application } from '@nativescript/core'
import { requestAnimationFrame } from '@nativescript/core/animation-frame'
import meta, { SwitchStage, UncheckedLight } from './Switch.stories.ios'
import { CAPTURE_PROFILE } from '../../../../../tools/visual/src/scenario'
import { assertSwitchGeometry } from '../../../../../tools/visual/src/geometry'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import {
	NSLocale,
	NSTimeZone,
	UIDevice,
	UIGraphicsImageRenderer,
	UIGraphicsImageRendererFormat,
	UIImagePNGRepresentation,
	UIScreen,
	UIView,
} from '@octane-xplat/platform/ios'

import type { CGRect } from '@octane-xplat/platform/ios'

declare const __VISUAL_CAPTURE__: null | {
	url: string
	runId: string
	revision: string
	scenarioHash: string
}

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

function StorybookRender(args: any) @{
	<SwitchStage {...args} />
}

function PreparedStory(props: { composed: any; args: any }) @{
	<>{props.composed(props.args)}</>
}

// Ordinary mobile tests do not capture or write visual artifacts.
it.skipIf(!__VISUAL_CAPTURE__)('captures the real iOS Switch stage', async () => {
	const config = __VISUAL_CAPTURE__!
	const composed = composeStory(
		UncheckedLight,
		meta,
		{
			render: StorybookRender,
		},
		{},
		'UncheckedLight',
	)

	expect(composed.id).toBe('switch--unchecked-light')
	const window = Application.ios.nativeApp.keyWindow
	if (!window) {
		throw new Error('iOS test host has no key window')
	}

	const previousAppearance = window.overrideUserInterfaceStyle
	window.overrideUserInterfaceStyle = 1 // UIKit light appearance
	try {
		for (const [index, displacement] of [0, 0, 0, 1].entries()) {
			const mounted = await mountXplat(PreparedStory, {
				composed,
				args: { ...composed.args, displacement },
			})

			try {
				const stage = mounted.view.getViewById(composed.id)
				await waitUntil(
					() =>
						Boolean(
							stage?.isLoaded && stage.ios?.window && findByTestId(mounted.view, 'visual-switch'),
						),
					{
						timeout: 5000,
						message: 'Selected iOS story did not become ready',
					},
				)

				const native = stage!.ios as UIView
				let stable = 0
				let previous = ''
				const deadline = Date.now() + 5000
				while (stable < 2) {
					await frame()
					native.layoutIfNeeded()
					const geometry = JSON.stringify([
						native.bounds.size.width,
						native.bounds.size.height,
						findByTestId(mounted.view, 'visual-switch')!.getActualSize(),
					])

					stable = geometry === previous ? stable + 1 : 0
					previous = geometry
					if (Date.now() > deadline) {
						throw new Error('iOS stage layout did not settle')
					}
				}

				expect(native.bounds.origin.x).toBe(0)
				expect(native.bounds.origin.y).toBe(0)
				expect(native.bounds.size.width).toBe(CAPTURE_PROFILE.width)
				expect(native.bounds.size.height).toBe(CAPTURE_PROFILE.height)
				const control = findByTestId(mounted.view, 'visual-switch')! as any
				const thumbPosition = control.getChildAt(0).getLocationRelativeTo(control)
				const trackRect = control.ios.convertRectToView(control.ios.bounds, native)
				const thumb = control.getChildAt(0)
				const thumbRect = thumb.ios.convertRectToView(thumb.ios.bounds, native)
				const captureRect = (rect: CGRect) => ({
					x: rect.origin.x,
					y: rect.origin.y,
					width: rect.size.width,
					height: rect.size.height,
				})

				assertSwitchGeometry(
					{
						stage: captureRect(native.bounds),
						track: captureRect(trackRect),
						thumb: captureRect(thumbRect),
					},
					Boolean(composed.args.checked),
					displacement,
				)

				expect(composed.args.checked).toBe(false)
				expect(thumbPosition.x).toBe(3)
				expect(thumbPosition.y).toBe(3)
				const format = UIGraphicsImageRendererFormat.defaultFormat()
				format.scale = CAPTURE_PROFILE.scale
				format.opaque = true
				const renderer = UIGraphicsImageRenderer.alloc().initWithSizeFormat(
					native.bounds.size,
					format,
				)

				let drawn = false
				const image = renderer.imageWithActions(() => {
					drawn = native.drawViewHierarchyInRectAfterScreenUpdates(native.bounds, true)
				})

				expect(drawn).toBe(true)
				const png = UIImagePNGRepresentation(image)
				expect(png).toBeTruthy()
				const response = await fetch(config.url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...config,
						url: undefined,
						index,
						displacement,
						storyId: composed.id,
						args: composed.args,
						target: 'ios',
						provenance: 'real',
						profile: CAPTURE_PROFILE,
						width: image.size.width,
						height: image.size.height,
						runtime: {
							os: UIDevice.currentDevice.systemVersion,
							scale: UIScreen.mainScreen.scale,
							locale: NSLocale.currentLocale.localeIdentifier,
							timezone: NSTimeZone.localTimeZone.name,
							capture: 'UIKit drawViewHierarchy, explicit 1x renderer; no postcapture resizing',
						},
						pngBase64: png!.base64EncodedStringWithOptions(0 as any),
						readiness: { geometry: previous, stableFrames: stable },
					}),
				})

				expect(response.ok).toBe(true)
			} finally {
				await mounted.unmount()
			}
		}
	} finally {
		window.overrideUserInterfaceStyle = previousAppearance
	}
})
