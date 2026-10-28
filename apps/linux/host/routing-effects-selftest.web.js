// Load the production web routing fixture in the actual WebKitGTK host.
// DOM calls/handlers establish browser behavior, not physical keyboard input.
;(async () => {
	const log = (value) => webkit.messageHandlers.xplatLog.postMessage(value)
	const failed = []
	const errors = []
	let checks = 0
	addEventListener('error', (event) => errors.push(event.message))
	addEventListener('unhandledrejection', (event) => errors.push(String(event.reason)))
	const wait = async (predicate) => {
		const deadline = Date.now() + 10000
		while (!predicate()) {
			if (Date.now() >= deadline) {
				throw new Error('Browser condition did not settle')
			}

			await new Promise((resolve) => setTimeout(resolve, 20))
		}
	}
	const equal = (actual, expected) => {
		if (JSON.stringify(actual) !== JSON.stringify(expected)) {
			throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
		}
	}
	const check = async (name, action) => {
		checks++
		try {
			await action()
			log(`ROUTING_EFFECT ${name}=true`)
		} catch (error) {
			failed.push(name)
			log(`ROUTING_EFFECT ${name}!=>${error.message}`)
			throw error
		}
	}
	const focused = (id) => document.activeElement === document.getElementById(id)
	try {
		await check('ready', () => wait(() => !!window.__routing))
		await check('page-focus-and-head', async () => {
			equal(await window.__routing.focusPage('same'), 'committed')
			equal([focused('focus-heading'), document.title, scrollY], [true, 'Focus same', 0])
		})

		await check('refresh-preserves-focus-and-scroll', async () => {
			document.getElementById('focus-control').focus({ preventScroll: true })
			scrollTo(0, 300)
			await wait(() => scrollY === 300)
			await window.__routing.refresh()
			equal([focused('focus-control'), scrollY], [true, 300])
		})

		await check('same-url-new-entry', async () => {
			await window.__routing.focusPage('same')
			equal([focused('focus-heading'), scrollY], [true, 0])
			document.getElementById('focus-bottom-control').focus({ preventScroll: true })
			scrollTo(0, 700)
			await wait(() => scrollY === 700)
			await window.__routing.focusPage('other')
		})

		await check('back-second-entry', async () => {
			equal(await window.__routing.back(), 'committed')
			equal([focused('focus-bottom-control'), scrollY], [true, 700])
		})

		await check('back-first-entry', async () => {
			equal(await window.__routing.back(), 'committed')
			equal([focused('focus-control'), scrollY], [true, 300])
		})

		await check('forward-entry', async () => {
			history.forward()
			await wait(() => scrollY === 700 && focused('focus-bottom-control'))
		})

		await check('decoded-fragment', async () => {
			await window.__routing.focusPage('fragment', 'part one')
			const target = document.getElementById('part one')
			equal(
				[focused('part one'), Math.abs(target.getBoundingClientRect().top) < 1, location.hash],
				[true, true, '#part%20one'],
			)
		})

		const beforeModal = scrollY
		await check('modal-isolation', async () => {
			await window.__routing.modal()
			const panel = document.querySelector('[role="dialog"]')
			equal(
				[
					document.activeElement === panel,
					document.getElementById('app').hasAttribute('inert'),
					scrollY,
				],
				[true, true, beforeModal],
			)
		})

		await check('modal-screen-focus', async () => {
			await window.__routing.modalPush()
			const panel = document.querySelector('[role="dialog"]')
			equal(panel.contains(document.activeElement), true)
			document.getElementById('focus-control').focus()
			equal(panel.contains(document.activeElement), true)
		})

		await check('modal-return-focus-and-scroll', async () => {
			await window.__routing.dismiss()
			equal(
				[focused('part one'), document.getElementById('app').hasAttribute('inert'), scrollY],
				[true, false, beforeModal],
			)
		})

		await check('superseded-loader-effects', async () => {
			window.__routing.beginFeedback()
			await wait(() => window.__routing.feedbackLoads === 1)
			await window.__routing.focusPage('latest')
			document.getElementById('focus-control').focus({ preventScroll: true })
			scrollTo(0, 250)
			await wait(() => scrollY === 250)
			equal(await window.__routing.releaseFeedback(), 'cancelled')
			await new Promise(requestAnimationFrame)
			equal([focused('focus-control'), document.title, scrollY], [true, 'Focus latest', 250])
		})

		await check('public-independent-panes', async () => {
			const report = await window.__routing.qualifyPanes()
			equal(report.checks.length, 11)
			equal([report.urlUnchanged, report.historyUnchanged], [true, true])
		})

		await check('no-browser-errors', () => equal(errors, []))
	} catch (error) {
		if (!failed.length) {
			failed.push(String(error))
		}
	} finally {
		log(
			`SELFTEST_RESULT ${JSON.stringify({ checks, failed, errors, target: 'webkitgtk', physicalInput: false, screenshots: false })}`,
		)
	}
})()
