// Unit 10: real browser clicks/keyboard + textual DOM state. No images.
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { pinnedRoutes } from '../src/coverage/pinned.ts'

export const contentChatRoutes = pinnedRoutes.filter(
	(row) =>
		row.kind === 'template-block' &&
		(/^Chat/.test(row.family) ||
			['Markdown', 'CodeBlock', 'SyntaxTheme'].includes(row.family) ||
			row.name === 'useStreamingTextHookUsage'),
)

function selectorFor(row) {
	if (/^ChatComposer/.test(row.family) || row.family === 'ChatDictationButton') {
		return '.vx-chatcomposer'
	}
	if (row.family === 'ChatDictation') {
		return '.vx-chatdict'
	}
	if (row.family === 'ChatLayoutScrollButton') {
		return '.vx-chatscroll-wrap'
	}
	if (row.family === 'ChatSendButton') {
		return row.name.endsWith('InComposer') ? '.vx-chatcomposer' : '.vx-chatsend'
	}
	if (row.family === 'ChatToolCalls') {
		return '.vx-chattools-row'
	}
	if (/^Chat/.test(row.family)) {
		return '.vx-chatlist'
	}
	if (row.family === 'CodeBlock' || row.family === 'SyntaxTheme') {
		return '.vx-codeblock'
	}
	if (row.name === 'MarkdownDataTable') {
		return 'table'
	}
	if (row.name === 'MarkdownCitedContent') {
		return 'a.vx-citation'
	}
	return 'body'
}

export async function verifyContentChat(page, baseUrl, check) {
	const go = async (name) => {
		await page.goto(`${baseUrl}/templates/${name}/?embed=1`, { waitUntil: 'networkidle' })
	}
	assert.equal(contentChatRoutes.length, 75, 'pinned unit-10 route count')
	for (const row of contentChatRoutes) {
		await go(row.name)
		await page.locator(selectorFor(row)).first().waitFor({ state: 'attached' })
		const text = await page.locator('body').innerText()
		assert(!text.includes('Not ported yet'), row.name)
		const sourcePath = new URL(
			`../src/examples/${row.family.toLowerCase()}/${row.name}.tsrx`,
			import.meta.url,
		)

		const webPath = new URL(sourcePath.href.replace('.tsrx', '.web.tsrx'))
		const source = readFileSync(existsSync(sourcePath) ? sourcePath : webPath, 'utf8')
		assert(
			source.includes(
				`export function ${row.name === 'useStreamingTextHookUsage' ? 'UseStreamingTextHookUsage' : row.name}`,
			),
		)

		check(`unit-10 rendered ${row.route}`, true, `${selectorFor(row)}; running source available`)
	}

	await go('MarkdownShowcase')
	assert((await page.locator('[style*="line-through"]').innerText()).includes('strikethrough'))
	assert.equal(await page.locator('a[href="https://example.com"]').count(), 1)
	await go('MarkdownRichContent')
	assert((await page.locator('body').innerText()).includes('☑ Parser'))
	assert((await page.locator('body').innerText()).includes('☐ Stories'))
	assert.equal(await page.locator('.vx-codeblock').count(), 1)
	await go('MarkdownDataTable')
	assert.equal(await page.locator('th').count(), 4)
	assert.equal(await page.locator('tbody tr').count(), 4)
	assert((await page.locator('table').innerText()).includes('Learning Curve'))
	await go('MarkdownCitedContent')
	assert.equal(await page.locator('a.vx-citation').count(), 6)
	assert.equal(
		await page.locator('a.vx-citation').first().getAttribute('href'),
		'https://en.wikipedia.org/wiki/Tokyo',
	)
	assert(!(await page.locator('body').innerText()).includes('[abc1]'))
	await go('MarkdownCompactAIResponse')
	assert.equal(await page.locator('.vx-codeblock').count(), 1)
	assert.equal(await page.locator('h4').first().innerText(), 'Design Tokens')
	check('unit-10 Markdown formatting, table, citations, compact headings and code', true)

	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: {
				writeText: async (text) => {
					window.__unit10Copied = text
				},
			},
		})
	})
	await go('CodeBlockShowcase')
	await page.getByRole('button', { name: 'Copy code', exact: true }).click()
	await page.getByRole('button', { name: 'Copied', exact: true }).waitFor()
	assert((await page.evaluate(() => window.__unit10Copied)).includes('export function useUser'))
	check(
		'unit-10 CodeBlock copy value and feedback',
		true,
		'browser click with clipboard API mock; OS clipboard not run',
	)

	await go('CodeBlockHighlightedLines')
	assert.equal(await page.locator('.vx-codeblock-line--highlighted').count(), 3)
	await go('CodeBlockScrollableBlock')
	assert.equal(await page.locator('[data-line]').count(), 50)
	assert.equal(
		await page.locator('.vx-codeblock-body').evaluate((el) => getComputedStyle(el).maxHeight),
		'280px',
	)
	check('unit-10 CodeBlock highlighted lines, line numbers and scroll height', true)

	for (const [name, color] of [
		['SyntaxThemeDarkPreset', '#ff79c6'],
		['SyntaxThemeLightPreset', '#cf222e'],
		['SyntaxThemeShowcase', '#c678dd'],
	]) {
		await go(name)
		const keyword = await page
			.locator('.vx-codeblock')
			.evaluate((el) => getComputedStyle(el).getPropertyValue('--color-syntax-keyword').trim())

		assert.equal(keyword, color)
	}
	check('unit-10 syntax preset token scopes', true)

	await go('ChatComposerInputControlledInput')
	const field = page.locator('[contenteditable="true"]')
	await field.fill('Hello Octane')
	await page.waitForFunction(() => document.body.textContent.includes('Value: "Hello Octane"'))
	await field.press('Enter')
	await page.waitForFunction(() => document.body.textContent.includes('Value: ""'))
	assert.equal(await field.innerText(), '')
	check('unit-10 controlled composer type, Enter send and clear', true, 'browser keyboard')

	await go('ChatComposerInputDisabled')
	assert.equal(await page.locator('[contenteditable="true"]').count(), 0)
	assert.equal(await page.getByRole('button', { name: 'Send', exact: true }).isDisabled(), true)
	await go('ChatComposerValidation')
	assert(
		(await page.locator('body').innerText()).includes('Failed to send message. Please try again.'),
	)
	assert((await page.locator('body').innerText()).includes('Context window is 90% full.'))
	check('unit-10 disabled composer and error/warning strips', true)

	for (const [name, query, result] of [
		['ChatComposerInputMentionTrigger', '@cin', '@cindy'],
		['ChatComposerInputMultipleTriggers', '/sum', '/summarize'],
		['ChatComposerInputSlashCommands', '/sum', '/summarize'],
	]) {
		await go(name)
		const input = page.locator('[contenteditable="true"]')
		await input.fill(query)
		await page.getByRole('option').first().waitFor()
		await input.press('ArrowDown')
		await input.press('Enter')
		await page.waitForFunction(
			(expected) =>
				document.querySelector('[contenteditable="true"]')?.textContent.includes(expected),
			result === '@cindy' ? 'Cindy Zhang' : result,
		)

		check(`unit-10 trigger selection ${name}`, true, 'browser keyboard; serialized value preserved')
	}

	await go('ChatComposerStreaming')
	await page.getByRole('button', { name: 'Send', exact: true }).click()
	await page.getByRole('button', { name: 'Stop', exact: true }).waitFor()
	assert((await page.locator('body').innerText()).includes('Streaming — click stop to cancel'))
	await page.getByRole('button', { name: 'Stop', exact: true }).click()
	await page.getByRole('button', { name: 'Send', exact: true }).waitFor()
	assert((await page.locator('body').innerText()).includes('Send a message to start streaming'))
	check('unit-10 streaming send/stop state transition', true)

	await go('ChatComposerDrawerCollapsible')
	const drawerToggle = page.getByRole('button', { name: 'Collapse Files', exact: true })
	await drawerToggle.click()
	assert.equal(
		await page
			.getByRole('button', { name: 'Expand Files', exact: true })
			.getAttribute('aria-expanded'),
		'false',
	)
	await page.getByRole('button', { name: 'Expand Files', exact: true }).press('Enter')
	assert.equal(
		await page
			.getByRole('button', { name: 'Collapse Files', exact: true })
			.getAttribute('aria-expanded'),
		'true',
	)
	await go('ChatComposerDrawerFeedback')
	await page.getByText('No, and tell me what to do differently', { exact: true }).click()
	assert.equal(await page.locator('.vx-listitem--selected').count(), 1)
	check('unit-10 drawer collapse/keyboard expansion and feedback selection', true)

	await go('ChatComposerFooterActions')
	await page.getByRole('button', { name: 'Auto', exact: true }).click()
	await page.getByRole('menuitem', { name: 'Model B', exact: true }).click()
	assert.equal(await page.getByRole('menu').count(), 0)
	check(
		'unit-10 footer menu opens, selects and dismisses',
		true,
		'upstream options are demonstrative no-op actions',
	)

	await go('ChatToolCallsInteractiveToolCalls')
	const detail = page.locator('.vx-chattools-row[role="button"]').first()
	await detail.click()
	assert.equal(await detail.getAttribute('aria-expanded'), 'true')
	assert((await page.locator('.vx-codeblock').first().innerText()).includes('formatDate'))
	await detail.press('Enter')
	assert.equal(await detail.getAttribute('aria-expanded'), 'false')
	await go('ChatToolCallsStatuses')
	for (const status of ['pending', 'running', 'complete', 'error']) {
		assert.equal(await page.locator(`.vx-chattools-status--${status}`).count(), 1)
	}
	assert.equal(
		await page.locator('.vx-chattools-status--error').getAttribute('aria-label'),
		'Error: 3 lint errors found',
	)
	await go('ChatMessageListFullFeatured')
	assert((await page.locator('.vx-chatlist-empty').innerText()).includes('No messages yet'))
	check('unit-10 tool detail expansion, pending/running/error states and empty messages', true)

	await go('ChatSendButtonStates')
	assert.equal(
		await page.getByRole('button', { name: 'Send', exact: true }).first().isDisabled(),
		true,
	)
	assert.equal(
		await page.getByRole('button', { name: 'Send', exact: true }).nth(1).isDisabled(),
		false,
	)
	assert.equal(await page.getByRole('button', { name: 'Stop', exact: true }).isDisabled(), false)
	await go('ChatTokenizedTextColors')
	assert.equal(await page.locator('.vx-chattext-token').count(), 3)
	await go('ChatLayoutScrollButtonStates')
	assert.equal(await page.locator('.vx-chatscroll-btn').count(), 2)
	check('unit-10 send states, displayed tokens and visible/hidden scroll controls', true)

	await go('ChatDictationDictationStates')
	assert.equal(await page.getByRole('button', { name: 'Start dictation', exact: true }).count(), 1)
	assert.equal(await page.getByRole('button', { name: 'Stop dictation', exact: true }).count(), 2)
	check(
		'unit-10 fixture dictation idle/listening/speaking',
		true,
		'fixture state only; OS speech not run',
	)

	// A separate page forces unsupported capability deterministically. This
	// is an API-capability mock, not speech permission/service evidence.
	const unsupported = await page.context().newPage()
	try {
		await unsupported.addInitScript(() => {
			window.SpeechRecognition = undefined
			window.webkitSpeechRecognition = undefined
		})

		await unsupported.goto(`${baseUrl}/templates/ChatDictationButtonShowcase/?embed=1`, {
			waitUntil: 'networkidle',
		})

		assert(
			(await unsupported.locator('body').innerText()).includes(
				'SpeechRecognition is not supported in this browser.',
			),
		)

		assert.equal(await unsupported.locator('.vx-chatdict-btn').count(), 0)
		check(
			'unit-10 unsupported dictation explanation and hidden mic',
			true,
			'capability mock; OS speech not run',
		)
	} finally {
		await unsupported.close()
	}

	const supported = await page.context().newPage()
	const speechErrors = []
	supported.on('pageerror', (error) => speechErrors.push(String(error)))
	try {
		await supported.addInitScript(() => {
			Object.defineProperty(navigator, 'mediaDevices', {
				configurable: true,
				value: {
					getUserMedia: async () => {
						throw new Error('Test has no microphone')
					},
				},
			})
			window.SpeechRecognition = class {
				start() {
					window.__unit10Speech = this
					this.onstart?.()
				}
				stop() {
					this.onend?.()
				}
				abort() {
					this.onend?.()
				}
			}
			window.webkitSpeechRecognition = undefined
		})

		await supported.goto(`${baseUrl}/templates/ChatDictationButtonBasic/?embed=1`, {
			waitUntil: 'networkidle',
		})

		await supported.getByRole('button', { name: 'Start dictation', exact: true }).click()
		await supported.getByRole('button', { name: 'Stop dictation', exact: true }).waitFor()
		await supported.evaluate(() => {
			const result = [{ transcript: 'Mock dictated text' }]
			result.isFinal = true
			window.__unit10Speech.onresult({ resultIndex: 0, results: [result] })
		})

		await supported.waitForFunction(() =>
			document
				.querySelector('[contenteditable="true"]')
				?.textContent.includes('Mock dictated text'),
		)

		await supported.getByRole('button', { name: 'Stop dictation', exact: true }).click()
		await supported.getByRole('button', { name: 'Start dictation', exact: true }).waitFor()
		assert.equal(speechErrors.length, 0, speechErrors.join(' | '))
		check(
			'unit-10 supported dictation start/transcript/stop',
			true,
			'browser button input + synthetic recognition callbacks; no microphone or OS speech',
		)
	} finally {
		await supported.close()
	}

	// Completed upstream hook sample, plus running Octane source in shell.
	await go('useStreamingTextHookUsage')
	assert(
		(await page.locator('body').innerText()).includes(
			'Astryx hooks keep behavior reusable while components keep visuals consistent.',
		),
	)
	await page.getByRole('button', { name: 'Reset', exact: true }).click()
	assert((await page.locator('body').innerText()).includes('No response yet'))
	await page.getByRole('button', { name: 'Start streaming', exact: true }).click()
	await page.waitForFunction(
		() =>
			document.body.textContent.includes('Complete') &&
			document.body.textContent.includes(
				'Astryx hooks keep behavior reusable while components keep visuals consistent.',
			),
	)
	check(
		'unit-10 streaming text empty, progressive start and completion',
		true,
		'browser input; hook timer rendering',
	)
	await page.goto(`${baseUrl}/templates/ChatComposerStreaming/`, { waitUntil: 'networkidle' })
	await page.getByRole('radio', { name: 'Code', exact: true }).click()
	assert((await page.locator('.vx-codeblock').innerText()).includes("from '@octane-xplat/ui/chat'"))
	check('unit-10 completed streaming text and running source view', true)
}
