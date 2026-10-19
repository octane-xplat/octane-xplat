import { expect, it } from 'vitest'
import { createKeyboardMotion } from '../src/motion'

const windowRect = { x: 0, y: 0, width: 400, height: 800 }
const frame = (y: number) => ({ x: 0, y, width: 400, height: 800 - y })

it('retains measured position through reversal and cancels before replacement', () => {
	const values: any[] = []
	const motion = createKeyboardMotion((value) => values.push(value), {
		interactive: false,
		floating: false,
	})
	motion.measure(windowRect, frame(800))
	motion.begin(frame(500), 300)
	expect(values.at(-1).currentFrame.y).toBe(800)
	expect(values.at(-1).targetFrame.y).toBe(500)
	motion.measure(windowRect, frame(650))
	motion.begin(frame(800), 200)
	expect(values.slice(-2).map((v) => v.motion.phase)).toEqual(['cancel', 'start'])
	expect(values.slice(-2).map((v) => v.currentFrame.y)).toEqual([650, 650])
	expect(values.at(-1).motion.transitionId).toBe(2)
	motion.measure(windowRect, frame(800))
	motion.end()
	motion.end()
	expect(values.at(-1).motion.phase).toBe('end')
	expect(values.at(-1).inset).toBe(0)
})

it('supports already-open attachment without inventing an opening animation', () => {
	const values: any[] = []
	const motion = createKeyboardMotion((value) => values.push(value), {
		interactive: false,
		floating: false,
	})
	motion.measure(windowRect, frame(500))
	expect(values[0].motion.phase).toBe('idle')
	expect(values[0].inset).toBe(300)
	expect(values[0].currentFrame).toEqual(values[0].targetFrame)
})
