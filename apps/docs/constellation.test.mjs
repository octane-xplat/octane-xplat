import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { animateConstellation } from './src/constellation.ts'

test('constellation keeps 50–80% fading and follows scroll, motion preference, and cleanup', (t) => {
	t.mock.timers.enable({ apis: ['setTimeout'] })
	const dom = new JSDOM(
		'<div id="host"><svg>' + '<polygon />'.repeat(20) + '</svg></div><div id="content"></div>',
	)

	const previousWindow = globalThis.window
	globalThis.window = dom.window
	t.after(() => {
		globalThis.window = previousWindow
		dom.window.close()
	})

	const motion = new dom.window.EventTarget()
	motion.matches = false
	dom.window.matchMedia = () => motion
	const host = dom.window.document.getElementById('host')
	const content = dom.window.document.getElementById('content')
	const live = new Map()
	const started = []
	for (const element of host.querySelectorAll('polygon')) {
		element.animate = (frames, options) => {
			assert.deepEqual(
				frames.map((frame) => frame.opacity),
				[1, 0.35, 1],
			)

			assert.ok(options.duration >= 2340 && options.duration < 4680)
			assert.ok(!live.has(element), 'an element cannot have overlapping fades')
			const animation = { cancel: () => live.delete(element) }
			live.set(element, animation)
			started.push(element)
			assert.ok(live.size <= 16, 'at most 80% may fade simultaneously')
			return animation
		}
	}

	const advance = () => {
		for (let i = 0; i < 40; i++) {
			t.mock.timers.tick(300)
		}
	}

	const scrollTo = (top) => {
		content.scrollTop = top
		content.dispatchEvent(new dom.window.Event('scroll'))
	}

	const dispose = animateConstellation(host, content)
	assert.equal(live.size, 10, 'at least 50% fade immediately')
	advance()
	assert.equal(live.size, 16)
	assert.equal(started.length, 16)
	const [finishedElement, finishedAnimation] = [...live][0]
	live.delete(finishedElement)
	finishedAnimation.onfinish()
	advance()
	assert.equal(live.size, 16, 'completed fades free a slot')
	assert.equal(started.length, 17)

	// Finish a whole batch without advancing the scheduler: completion alone
	// must replace enough fades to maintain the minimum.
	const batch = [...live]
	for (const [element, animation] of batch) {
		live.delete(element)
		animation.onfinish()
		assert.ok(live.size >= 10 && live.size <= 16, 'completion maintains 50–80%')
	}

	scrollTo(1)
	assert.equal(live.size, 0, 'leaving the top restores all elements')
	const beforeScroll = started.length
	advance()
	assert.equal(started.length, beforeScroll, 'no new fades while scrolled')
	scrollTo(0)
	assert.equal(live.size, 10, 'returning to the top restores the minimum immediately')
	advance()
	assert.equal(live.size, 16, 'returning to the top resumes fades')

	motion.matches = true
	motion.dispatchEvent(new dom.window.Event('change'))
	assert.equal(live.size, 0)
	const beforeReduced = started.length
	advance()
	assert.equal(started.length, beforeReduced, 'reduced motion disables fades')
	motion.matches = false
	motion.dispatchEvent(new dom.window.Event('change'))
	assert.equal(live.size, 10, 'disabling reduced motion restores the minimum')
	advance()
	assert.equal(live.size, 16)
	dispose()
	assert.equal(live.size, 0)
	const beforeDispose = started.length
	scrollTo(0)
	advance()
	assert.equal(started.length, beforeDispose, 'cleanup removes timers and listeners')
})
