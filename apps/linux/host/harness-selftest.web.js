// Handler-driven UI checks inside the real GTK WebView. These do not claim
// physical input or pixel parity. The host's self-test result sets exit status.
;(async () => {
	const log = (message) => webkit.messageHandlers.xplatLog.postMessage(message)
	const failed = []
	let checks = 0
	const errors = []
	addEventListener('error', (event) => errors.push(event.message))
	addEventListener('unhandledrejection', (event) => errors.push(String(event.reason)))
	const wait = async (predicate, description = 'condition') => {
		const deadline = Date.now() + 5000
		while (Date.now() < deadline) {
			if (predicate()) {
				return
			}

			await new Promise((resolve) => setTimeout(resolve, 50))
		}

		throw new Error(`${description} did not settle at ${location.pathname}; ${errors.join('; ')}`)
	}

	const text = () => document.body.textContent
	const clickText = (label, selector = 'button, [role="button"], a') => {
		const element = [...document.querySelectorAll(selector)].find(
			(node) => node.textContent.trim() === label,
		)

		if (!element) {
			throw new Error(`missing action: ${label}`)
		}

		element.click()
	}

	const click = (selector) => {
		const element = document.querySelector(selector)
		if (!element) {
			throw new Error(`missing element: ${selector}`)
		}

		element.click()
	}

	const check = async (name, action) => {
		checks++
		try {
			await action()
			log(`HARNESS_STEP ${name}=true`)
		} catch (error) {
			failed.push(name)
			log(`HARNESS_STEP ${name}!=>${error.message}`)
			throw error
		}
	}

	try {
		await check('mount', () => wait(() => text().includes('Count: 0')))
		await check('increment', async () => {
			clickText('Increment')
			await wait(() => text().includes('Count: 1'))
		})

		await check('textarea', async () => {
			const field = document.querySelector('#probe-textarea')
			if (!field) {
				throw new Error('missing textarea')
			}

			const before = field.offsetHeight
			field.value = 'line one\nline two\nline three'
			field.dispatchEvent(new Event('input', { bubbles: true }))
			await wait(() => field.offsetHeight > before && field.value.includes('line three'))
		})

		await check('apps-tab', async () => {
			click('[role="tab"][data-tab-value="apps"]')
			await wait(() => text().includes('Last opened:'))
		})

		await check('counter-route', async () => {
			clickText('Counter', '[role="button"]')
			await wait(
				() => location.pathname === '/demos/demo/counter' && text().includes('Demo count: 0'),
			)
		})

		await check('route-back', async () => {
			clickText('← Back')
			await wait(() => location.pathname === '/' && text().includes('Last opened: counter'))
		})

		await check('virtual-list', async () => {
			click('#menu-vlist')
			await wait(() => document.querySelectorAll('#vlist .vx-virtual-list-row').length > 1)
			if (document.querySelectorAll('#vlist .vx-virtual-list-row').length >= 40) {
				throw new Error('unbounded virtual rows')
			}
		})

		await check('virtual-list-empty', async () => {
			click('#vl-clear')
			await wait(() =>
				document.querySelector('#vlist .vx-virtual-list-empty')?.textContent.includes('No rows'),
			)

			history.back()
			await wait(() => location.pathname === '/')
		})

		await check('sheet-open', async () => {
			click('[role="tab"][data-tab-value="test"]')
			await wait(() => text().includes('Open sheet'))
			clickText('Open sheet')
			await wait(() => document.querySelector('.vx-sheet-layer .sheet-panel'))
		})

		await check('sheet-dismiss', async () => {
			click('.vx-sheet-backdrop')
			await wait(() => !document.querySelector('.vx-sheet-layer'))
		})

		await check('overlay-open', async () => {
			click('[role="tab"][data-tab-value="home"]')
			await wait(() => document.querySelector('#overlay-btn'))
			click('#overlay-btn')
			await wait(() => document.querySelector('.vx-overlay .overlay-panel'))
		})

		await check('overlay-dismiss', async () => {
			click('.vx-overlay-shade')
			await wait(() => !document.querySelector('.vx-overlay'))
		})

		let editor
		await check('navigation-confirmation-holds', async () => {
			click('[role="tab"][data-tab-value="test"]')
			await wait(() => document.querySelector('#menu-navigation-blocking'), 'confirmation menu')
			click('#menu-navigation-blocking')
			await wait(
				() =>
					location.pathname === '/test/navigation-blocking' &&
					document.querySelector('#navigation-blocking'),
				'confirmation editor',
			)
			editor = document.querySelector('#navigation-blocking')
			click('#navigation-blocking-edit')
			await wait(
				() => document.querySelector('#navigation-blocking-dirty')?.textContent === 'Unsaved draft',
				'dirty draft',
			)
			click('#navigation-blocking-back')
			await wait(
				() => document.querySelector('#navigation-blocking-status')?.textContent === 'blocked',
				'blocked confirmation',
			)
			if (
				location.pathname !== '/test/navigation-blocking' ||
				document.querySelector('#navigation-blocking') !== editor
			) {
				throw new Error('confirmation replaced its admitted editor')
			}
		})

		await check('navigation-confirmation-refuses', async () => {
			click('#navigation-blocking-keep')
			await wait(
				() => document.querySelector('#navigation-blocking-status')?.textContent === 'idle',
			)
			if (
				location.pathname !== '/test/navigation-blocking' ||
				document.querySelector('#navigation-blocking') !== editor ||
				document.querySelector('#navigation-blocking-dirty')?.textContent !== 'Unsaved draft'
			) {
				throw new Error('refusal lost editor state')
			}
		})

		await check('navigation-confirmation-proceeds', async () => {
			click('#navigation-blocking-back')
			await wait(
				() => document.querySelector('#navigation-blocking-status')?.textContent === 'blocked',
				'blocked confirmation',
			)
			click('#navigation-blocking-leave')
			await wait(
				() => location.pathname === '/' && document.querySelector('#menu-navigation-blocking'),
			)
		})

		await check('no-unhandled-errors', () => {
			if (errors.length) {
				throw new Error(errors.join('; '))
			}
		})
	} catch {}

	log('SELFTEST_RESULT ' + JSON.stringify({ checks, failed }))
})()
