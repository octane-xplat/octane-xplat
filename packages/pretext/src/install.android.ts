import { Utils } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'
import { installNativeMeasurement, parseFont } from './measurement.js'
import './intl.js'

const paints = new Map<string, android.graphics.Paint>()

function paintFor(font: string): android.graphics.Paint {
	const cached = paints.get(font)

	if (cached) {
		return cached
	}

	const parsed = parseFont(font)
	const style = (parsed.weight >= 600 ? 1 : 0) | (parsed.italic ? 2 : 0)
	const family = ['-apple-system', 'system-ui', 'sans-serif'].includes(
		parsed.family.toLowerCase(),
	)
		? 'sans-serif'
		: parsed.family
	const paint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
	paint.setTypeface(android.graphics.Typeface.create(family, style))
	paint.setTextSize(Utils.layout.toDevicePixels(parsed.size))
	paints.set(font, paint)
	return paint
}

installNativeMeasurement((text, font) =>
	Utils.layout.toDeviceIndependentPixels(paintFor(font).measureText(text)),
)
