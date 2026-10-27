import { expect } from 'playwright/test'

// Browser keyboard/click input plus DOM state. No AT delivery or pixel claim.
export async function verifyLocale(page, baseUrl, check) {
	const go = (name) =>
		page.goto(`${baseUrl}/templates/${name}/?embed=1`, { waitUntil: 'networkidle' })
	await go('InternationalizationProvider01ShippedLocale')
	await expect(page.locator('.vx-select-placeholder')).toHaveText('Select…')
	await page.getByRole('radio', { name: 'FR', exact: true }).click()
	await expect(page.locator('.vx-select-placeholder')).toHaveText('Sélectionner…')
	check('locale switches live to French', true)
	await page.locator('.vx-select-trigger').click()
	await page.getByRole('option', { name: 'EMEA', exact: true }).click()
	await expect(page.locator('.vx-select-value')).toHaveText('EMEA')
	await page.getByRole('radio', { name: 'EN', exact: true }).click()
	await expect(page.locator('.vx-select-value')).toHaveText('EMEA')
	await page.getByRole('button', { name: 'Clear selection', exact: true }).click()
	await expect(page.locator('.vx-select-placeholder')).toHaveText('Select…')
	check('locale retains and clears controlled selection', true)
	await page.getByRole('radio', { name: 'FR', exact: true }).click()
	await page.locator('.vx-select-trigger').click()
	await page.getByRole('option', { name: 'Americas', exact: true }).click()
	await page.getByRole('button', { name: 'Effacer la sélection', exact: true }).click()
	await expect(page.locator('.vx-select-placeholder')).toHaveText('Sélectionner…')
	check('French clear label and restored placeholder', true)

	await go('InternationalizationProvider02Overrides')
	await expect(page.locator('.vx-select-placeholder')).toHaveText('Choose...')
	await page.locator('.vx-select-trigger').click()
	await page.getByRole('option', { name: 'APAC', exact: true }).click()
	await page.getByRole('button', { name: 'Clear selection', exact: true }).click()
	await expect(page.locator('.vx-select-placeholder')).toHaveText('Choose...')
	check('sparse override survives selection and clear; English fallback label', true)
	const savedButton = page.getByRole('button', { name: 'Announce saved', exact: true })
	await savedButton.focus()
	await page.keyboard.press('Enter')
	await expect(savedButton).toBeFocused()
	const polite = page.locator('[data-xplat-live-region="polite"]')
	const assertive = page.locator('[data-xplat-live-region="assertive"]')
	await expect(polite).toHaveText('Billing region saved')
	await expect(polite).toHaveAttribute('aria-live', 'polite')
	await page.getByRole('button', { name: 'Announce error', exact: true }).click()
	await expect(assertive).toHaveText('Billing region required')
	await expect(assertive).toHaveAttribute('aria-live', 'assertive')
	await page.getByRole('button', { name: 'Clear announcements', exact: true }).click()
	await expect(polite).toHaveText('')
	await expect(assertive).toHaveText('')
	await page.getByRole('button', { name: 'Announce saved', exact: true }).click()
	await expect(polite).toHaveText('Billing region saved')
	await expect(polite).toHaveText('', { timeout: 5000 })
	check('announcement channels, explicit clear, repeat and timeout (DOM only)', true)

	await go('InternationalizationProvider03RtlDirection')
	const rootDirection = await page.locator('html').getAttribute('dir')
	const scope = page.locator('[data-direction-scope]')
	const pager = scope.locator('.vx-pagination').first()
	await expect(scope).toHaveAttribute('dir', 'ltr')
	await expect(pager.getByRole('button', { name: 'Previous page' })).toHaveText('‹')
	await page.getByRole('radio', { name: 'RTL', exact: true }).click()
	await expect(scope).toHaveAttribute('dir', 'rtl')
	await expect(scope.locator('[data-locale-scope]').first()).toHaveText('en / rtl')
	await expect(page.locator('[data-nested-scope] [data-locale-scope]')).toHaveText('fr-FR / ltr')
	await expect(page.locator('[data-nested-scope]')).toHaveAttribute('dir', 'ltr')
	await expect(pager.getByRole('button', { name: 'Previous page' })).toHaveText('›')
	await expect(pager.getByRole('button', { name: 'Next page' })).toHaveText('‹')
	await pager.getByRole('button', { name: 'Next page' }).focus()
	await page.keyboard.press('Enter')
	await expect(pager.locator('[aria-current="page"]')).toHaveText('4')
	await pager.getByRole('button', { name: 'Previous page' }).focus()
	await page.keyboard.press('Space')
	await expect(pager.locator('[aria-current="page"]')).toHaveText('3')
	await page.getByRole('radio', { name: 'LTR', exact: true }).click()
	await expect(pager.getByRole('button', { name: 'Next page' })).toHaveText('›')
	check('RTL context, host dir, nested isolation, chevrons and keyboard page changes', true)
	check(
		'subtree direction does not mutate document',
		(await page.locator('html').getAttribute('dir')) === rootDirection,
	)

	await go('ComplexSelectorShowcase')
	await page.getByText('Select department', { exact: true }).click()
	const cells = page.locator('[data-grid-cell]')
	await expect(cells).toHaveCount(9)
	await cells.first().focus()
	for (const [key, index] of [
		['ArrowRight', 1],
		['ArrowDown', 4],
		['ArrowLeft', 3],
		['ArrowUp', 0],
		['End', 8],
		['Home', 0],
	]) {
		await page.keyboard.press(key)
		await expect(cells.nth(index)).toBeFocused()
	}
	await page.keyboard.press('Enter')
	await expect(page.locator('[data-grid-cell]')).toHaveCount(0)
	await expect(page.locator('body')).toContainText('Engineering')
	check('grid arrows, Home/End and Enter selection (browser keyboard input)', true)
	for (const name of [
		'InternationalizationProvider01ShippedLocale',
		'InternationalizationProvider02Overrides',
		'InternationalizationProvider03RtlDirection',
	]) {
		await page.goto(`${baseUrl}/templates/${name}/`, { waitUntil: 'networkidle' })
		await page.getByRole('radio', { name: 'Code', exact: true }).click()
		await expect(page.locator('.sb-preview-code')).toContainText(`export function ${name}`)
		check(`running source view ${name}`, true)
	}
}
