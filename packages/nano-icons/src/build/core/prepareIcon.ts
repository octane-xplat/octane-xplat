// Ported from react-native-nano-icons (MIT, © Software Mansion) — per-icon
// task: prepared layers → font placement → quadratic outlines. Adapted to
// take SVG content instead of a file path.
import { QUADRATIC_ERROR_BOUND_EM, toQuadraticPath } from './font/quadratic'
import { shouldSkipPath } from './glyph/parse'
import { computePlacement, transformPathForFont } from './glyph/placement'
import type { PathKitModule } from './pathkit/types'
import type { NanoLogger } from './types'
import { prepareSvgLayers } from './prepare'

export type IconTask = {
	/** Icon name — the glyphmap key (file basename or provided name). */
	file: string
	/** SVG document source. */
	svg: string
	fontFamily: string
	upm: number
	safeZone: number
}

export type IconLog = [level: 'info' | 'warn' | 'fail', message: string]

export type IconLayer = { fill: string | null; d: string }

export type IconResult = {
	file: string
	iconName: string
	adv: number
	layers: IconLayer[]
	logs: IconLog[]
	error: string | null
}

export function collectingLogger(logs: IconLog[]): NanoLogger {
	const push = (level: IconLog[0]) => (msg: string) => {
		logs.push([level, msg])
	}

	return {
		start: () => {},
		update: () => {},
		succeed: () => {},
		fail: push('fail'),
		info: push('info'),
		warn: push('warn'),
	}
}

export async function prepareIcon(task: IconTask, pathkit: PathKitModule): Promise<IconResult> {
	const logs: IconLog[] = []
	const logger = collectingLogger(logs)
	const iconName = task.file.replace(/\.svg$/i, '')
	const fileLabel = `[${task.fontFamily}: ${task.file}]`
	const result: IconResult = {
		file: task.file,
		iconName,
		adv: 0,
		layers: [],
		logs,
		error: null,
	}

	logger.info(`Processing ${task.file}`)

	let prepared
	try {
		prepared = await prepareSvgLayers({
			svg: task.svg,
			fileLabel,
			pathkit,
			logger,
		})
	} catch (err) {
		result.error = err instanceof Error ? err.message : String(err)
		return result
	}

	if (!prepared) {
		return result
	}

	const { vx, vy, scale, xOff, yOff, adv } = computePlacement({
		upm: task.upm,
		safeZone: task.safeZone,
		viewBox: prepared.viewBox,
	})

	result.adv = adv

	for (const p of prepared.paths) {
		if (shouldSkipPath(p.d, p.fill)) {
			continue
		}

		const placed = transformPathForFont(pathkit, p.d, {
			vx,
			vy,
			scale,
			xOff,
			yOff,
			upm: task.upm,
		})

		result.layers.push({
			fill: p.fill,
			d: toQuadraticPath(placed, task.upm * QUADRATIC_ERROR_BOUND_EM),
		})
	}

	if (result.layers.length === 0) {
		logger.warn(`${fileLabel} produced no glyphs: nothing in it paints`)
	}

	return result
}
