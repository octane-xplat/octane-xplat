// Chromium-only, textual/DOM-state evidence. No screenshots or visual analysis.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

export const mediaExamples = [
	'AspectRatioCircleImage',
	'AspectRatioImageGallery',
	'AspectRatioShowcase',
	'AspectRatioSquareImage',
	'AspectRatioWidescreen',
	'AspectRatioWithSkeleton',
	'MediaThemeImageOverlay',
	'MediaThemeLightScrim',
	'MediaThemeShowcase',
	'ThumbnailDisabled',
	'ThumbnailGallery',
	'ThumbnailRemovable',
	'ThumbnailShowcase',
	'ThumbnailStates',
	'LightboxGallery',
	'LightboxShowcase',
	'LightboxVideo',
	'LightboxZoom',
	'useContainerRevealHookUsage',
]

export async function verifyMedia(page, baseUrl, check, browser) {
	const goto = (name, query = '') =>
		page.goto(`${baseUrl}/templates/${name}/${query}`, { waitUntil: 'networkidle' })
	const stage = page.locator('.sb-preview-stage')
	for (const name of mediaExamples) {
		await goto(name)
		const content = await stage.locator('img, button, [role="button"], .vx-skeleton').count()
		check(
			`unit-8 route ${name} renders`,
			content > 0 && (await stage.locator('.sb-pending').count()) === 0,
			`${content} content nodes`,
		)
	}
	await goto('AspectRatioWidescreen')
	const ratio = page.locator('.vx-aspectratio').first()
	const before = await ratio.boundingBox()
	await page.setViewportSize({ width: 390, height: 844 })
	const after = await ratio.boundingBox()
	check(
		'unit-8 aspect-ratio survives viewport resize',
		before.width > 0 && after.width > 0 && Math.abs(after.width / after.height - 16 / 9) < 0.02,
		JSON.stringify({ before, after }),
	)
	await page.setViewportSize({ width: 1280, height: 900 })

	await goto('ThumbnailStates')
	check(
		'unit-8 thumbnail loading and empty states',
		(await stage.locator('.vx-thumbnail-placeholder').count()) === 1 &&
			(await stage.locator('.vx-skeleton').count()) === 1 &&
			(await stage.locator('.vx-thumbnail-overlay').count()) === 1,
	)
	await goto('ThumbnailDisabled')
	check(
		'unit-8 disabled removal',
		(await stage.locator('button[aria-label="Remove"]:disabled').count()) === 2,
	)
	await goto('ThumbnailGallery')
	const first = stage.locator('[role="button"]').first()
	await first.click()
	check(
		'unit-8 thumbnail preview selection',
		(await stage.textContent()).includes('Selected: forest-night.jpg'),
	)
	const removes = stage.locator('button[aria-label="Remove"]')
	await removes.first().click()
	check(
		'unit-8 removal does not select the next thumbnail',
		(await removes.count()) === 3 &&
			!(await stage.textContent()).includes('Selected: misty-valley.jpg'),
	)
	await goto('ThumbnailRemovable')
	await page.waitForFunction(() =>
		[...document.querySelectorAll('.vx-thumbnail-remove')].some(
			(el) => el.getAttribute('data-xds-image-mode') === 'light',
		),
	)
	check(
		'unit-8 image luminance chooses both surface modes',
		(await stage.locator('[data-xds-image-mode="light"]').count()) > 0 &&
			(await stage.locator('[data-xds-image-mode="dark"]').count()) > 0,
	)
	for (let i = 0; i < 4; i++) {
		await stage.locator('button[aria-label="Remove"]').first().click()
	}
	check('unit-8 removal reaches empty state', (await stage.textContent()).includes('All removed.'))

	// Verify the actual image error event. Intercept bytes rather than dispatching
	// a synthetic error callback; the browser owns decoding and fallback.
	await page.route('**/template-assets/light-scene-horizontal-1.png', (route) =>
		route.fulfill({ status: 200, contentType: 'image/png', body: 'invalid image bytes' }),
	)
	await goto('LightboxZoom')
	await page.waitForFunction(() => document.querySelector('.vx-thumbnail-placeholder'))
	check(
		'unit-8 browser image decode failure uses thumbnail placeholder',
		(await stage.locator('.vx-thumbnail-placeholder').count()) === 1,
	)
	await page.unroute('**/template-assets/light-scene-horizontal-1.png')

	await goto('useContainerRevealHookUsage', '?embed=1')
	const container = page.locator('.xds-reveal-container').first()
	const content = container.locator('.xds-reveal-content')
	await page.mouse.move(0, 0)
	assert.equal(await content.evaluate((el) => getComputedStyle(el).opacity), '0')
	await container.hover()
	await page.waitForTimeout(150)
	check(
		'unit-8 row hover reveals actions',
		(await content.evaluate((el) => getComputedStyle(el).opacity)) === '1',
	)
	await page.mouse.move(0, 0)
	// Focus is obtained through browser keyboard input, not element.focus().
	await page.keyboard.press('Tab')
	for (let i = 0; i < 80; i++) {
		if (
			await content.locator('button').evaluateAll((els) => els.includes(document.activeElement))
		) {
			break
		}

		await page.keyboard.press('Tab')
	}
	await page.waitForTimeout(150)
	check(
		'unit-8 keyboard focus reveals mounted actions',
		(await content.locator('button').evaluateAll((els) => els.includes(document.activeElement))) &&
			(await content.evaluate((el) => getComputedStyle(el).opacity)) === '1',
	)

	for (const theme of ['neutral', 'matcha', 'stone', 'gothic', 'chocolate', 'y2k']) {
		for (const mode of ['light', 'dark']) {
			await goto('MediaThemeImageOverlay', `?embed=1&theme=${theme}&mode=${mode}`)
			const scope = page.locator('.sb-media-bottom [data-xds-theme]').first()
			check(
				`unit-8 dark media scope ${theme}/${mode}`,
				(await scope.evaluate((el) => getComputedStyle(el).colorScheme)) === 'dark' &&
					(await scope.getAttribute('data-xds-theme')) === theme,
			)

			await goto('MediaThemeLightScrim', `?embed=1&theme=${theme}&mode=${mode}`)
			check(
				`unit-8 light media scope ${theme}/${mode}`,
				(await page
					.locator('.sb-media-light [data-xds-theme]')
					.first()
					.evaluate((el) => getComputedStyle(el).colorScheme)) === 'light' &&
					(await page
						.locator('.sb-media-light [data-xds-theme]')
						.first()
						.getAttribute('data-xds-theme')) === theme,
			)
		}
	}

	await goto('MediaThemeShowcase')
	await page.getByRole('button', { name: 'Preview theme', exact: true }).click()
	await page
		.locator('[role="menuitemradio"], [role="menuitem"]')
		.filter({ hasText: 'Matcha' })
		.first()
		.click()
	await page.waitForTimeout(150)
	check(
		'unit-8 live root theme change reaches media controls',
		(await stage.locator('[data-xds-theme="matcha"]').count()) === 1,
	)
	await page.locator('[aria-label="Light mode"], [aria-label="Dark mode"]').first().click()
	check(
		'unit-8 live root mode change preserves dark media context',
		(await stage
			.locator('[data-xds-theme]')
			.first()
			.evaluate((el) => getComputedStyle(el).colorScheme)) === 'dark',
	)

	for (const name of ['LightboxShowcase', 'LightboxVideo', 'LightboxZoom', 'LightboxGallery']) {
		await goto(name)
		await stage.locator('button, [role="button"]').first().click()
		const dialog = page.locator('.vx-lightbox-layer')
		await dialog.waitFor()
		await page.waitForFunction(() => document.activeElement?.closest('.vx-lightbox-stage'))
		check(`unit-8 ${name} opens`, await dialog.isVisible())
		if (name === 'LightboxGallery') {
			await page.keyboard.press('ArrowRight')
			await dialog.locator('.vx-lightbox-counter').filter({ hasText: '2 of 4' }).waitFor()
			check('unit-8 lightbox keyboard navigation', (await dialog.textContent()).includes('2 of 4'))
			await page.getByRole('button', { name: 'Next', exact: true }).click()
			await dialog.locator('.vx-lightbox-counter').filter({ hasText: '3 of 4' }).waitFor()
			check('unit-8 lightbox pointer navigation', (await dialog.textContent()).includes('3 of 4'))
		}

		if (name === 'LightboxZoom') {
			const image = dialog.locator('img')
			await image.click()
			check(
				'unit-8 lightbox zoom',
				await image.evaluate((el) => el.style.transform.includes('2.5')),
			)

			const box = await image.boundingBox()
			const centerX = box.x + box.width / 2,
				centerY = box.y + box.height / 2

			await page.mouse.move(centerX, centerY)
			await page.mouse.down()
			await page.mouse.move(centerX + 50, centerY + 25, { steps: 5 })
			check(
				'unit-8 lightbox pointer drag pans image',
				await image.evaluate((el) => el.style.transform.includes('translate(20px, 10px)')),
			)

			await page.mouse.up()
			check(
				'unit-8 lightbox stays zoomed after drag',
				await image.evaluate((el) => el.style.transform.includes('scale(2.5)')),
			)

			await image.click()
			check('unit-8 lightbox zoom reset', await image.evaluate((el) => el.style.transform === ''))
		}

		if (name === 'LightboxVideo') {
			const video = dialog.locator('video')
			await video.evaluate(
				(el) =>
					new Promise((resolve, reject) => {
						if (el.readyState >= 1) {
							resolve()
							return
						}
						el.addEventListener('loadedmetadata', resolve, { once: true })
						el.addEventListener('error', reject, { once: true })
					}),
			)

			check(
				'unit-8 video metadata and native controls',
				await video.evaluate((el) => el.controls && el.duration > 0),
			)

			await video.press('Space')
			await page.waitForFunction(() => {
				const el = document.querySelector('.vx-lightbox-media')
				return el instanceof HTMLVideoElement && !el.paused && el.currentTime > 0
			})

			check(
				'unit-8 video plays from browser keyboard input',
				await video.evaluate((el) => !el.paused && el.currentTime > 0),
			)

			await video.press('Space')
			check(
				'unit-8 video pauses from browser keyboard input',
				await video.evaluate((el) => el.paused),
			)
		}

		await page.keyboard.press('Escape')
		await dialog.waitFor({ state: 'detached' })
		await page.waitForFunction(() => document.documentElement.style.overflow !== 'hidden')
		await page.waitForFunction(() => document.activeElement?.closest('.sb-preview-stage'))
		check(
			`unit-8 ${name} returns focus to opener`,
			await stage.evaluate((el) => el.contains(document.activeElement)),
		)

		check(
			`unit-8 ${name} dismisses and unlocks scroll`,
			(await dialog.count()) === 0 &&
				(await page.evaluate(() => document.documentElement.style.overflow !== 'hidden')),
		)
	}

	// The multi-algorithm comparison is app-owned upstream. Test its numeric
	// output with deterministic remote responses; no pixels are opened by tools.
	const fixtureSource = readFileSync(
		new URL('../src/examples/media/ThumbnailShowcase.tsrx', import.meta.url),
		'utf8',
	)
	const fixturePng = Buffer.from(fixtureSource.match(/data:image\/png;base64,([^']+)/)[1], 'base64')
	await page.route('https://picsum.photos/**', (route) =>
		route.fulfill({ status: 200, contentType: 'image/png', body: fixturePng }),
	)
	await page.goto(`${baseUrl}/pages/media-mode/`, { waitUntil: 'networkidle' })
	check(
		'unit-8 media-mode page renders',
		(await page.textContent('body')).includes('Media Mode Comparison') &&
			(await page.locator('.sb-mode-swatch').count()) === 24,
	)
	await page.getByRole('button', { name: 'BT.709 Gamma', exact: true }).click()
	check(
		'unit-8 algorithm selection changes explanation',
		(await page.textContent('body')).includes('gamma-encoded sRGB'),
	)
	await page.getByRole('button', { name: 'WCAG 2', exact: true }).click()
	check(
		'unit-8 WCAG algorithm selection',
		(await page.textContent('body')).includes('threshold 0.18'),
	)
	await page.getByRole('button', { name: 'APCA', exact: true }).click()
	await page.waitForFunction(() =>
		[...document.querySelectorAll('.sb-mode-image-label + .sb-mode-value')].every((el) =>
			el.textContent.includes('light'),
		),
	)
	check(
		'unit-8 remote image sampling settles',
		(await page.locator('.sb-mode-image-label + .sb-mode-value').count()) === 8,
	)
	await page.unroute('https://picsum.photos/**')

	// Same public useMediaQuery consumer already delivered in unit 4. A coarse
	// pointer stays constant while a browser viewport resize crosses the query.
	const touch = await browser.newContext({
		hasTouch: true,
		isMobile: true,
		viewport: { width: 390, height: 844 },
	})
	const mobile = await touch.newPage()
	await mobile.goto(`${baseUrl}/templates/useContainerRevealHookUsage/`, {
		waitUntil: 'networkidle',
	})
	check(
		'unit-8 touch keeps row actions visible',
		(await mobile
			.locator('.xds-reveal-content')
			.first()
			.evaluate((el) => getComputedStyle(el).opacity)) === '1',
	)
	await mobile.goto(`${baseUrl}/templates/DialogAdaptivePresentation/`, {
		waitUntil: 'networkidle',
	})
	await mobile.getByRole('button', { name: 'Edit profile', exact: true }).click()
	check(
		'unit-8 compact coarse media query chooses sheet',
		(await mobile.locator('.vx-bottom-sheet').count()) > 0,
	)
	await mobile.getByRole('button', { name: 'Cancel', exact: true }).click()
	await mobile.setViewportSize({ width: 1300, height: 900 })
	await mobile.getByRole('button', { name: 'Edit profile', exact: true }).click()
	check(
		'unit-8 resize updates shared media query',
		(await mobile.locator('.vx-bottom-sheet').count()) === 0 &&
			(await mobile.getByRole('dialog').count()) > 0,
	)
	await touch.close()
}
