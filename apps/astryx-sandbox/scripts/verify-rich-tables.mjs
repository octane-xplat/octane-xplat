import { expect } from 'playwright/test'

// Real-browser text and geometry assertions. No screenshots or visual analysis.
export async function verifyRichTables(page, baseUrl, check) {
	// ==================== Unit 7: hierarchical and rich tables ====================

	const flatCases = [
		['/templates/TableShowcase/', 'Alice Johnson', 'Email'],
		['/templates/TableInCard/', 'Team Members', 'Diana Prince'],
		['/templates/TableStripedTable/', 'Eve Davis', 'Designer'],
		['/templates/TableGridDividersTable/', 'Retention', '$1.8M'],
		['/templates/TableRichCellTable/', 'alice@example.com', 'Engineer'],
		['/templates/TableSelectableTable/', 'alice@example.com', 'Admin'],
		['/templates/TableSortableTable/', 'Manager', 'charlie@example.com'],
		['/templates/TablePaginatedTable/', 'Alice Johnson', 'Charlie Brown'],
		['/templates/TableColumnSettingsTable/', 'Department', 'Operations'],
		['/templates/TableResizableTable/', 'Analyst', 'eve@example.com'],
		['/templates/ColumnResizeHookUsage/', 'Analyst', 'PM'],
		['/templates/TableFilterableTable/', 'Infrastructure', 'Admin'],
		['/templates/TableInlineFilterTable/', 'Infrastructure', 'Any'],
		['/templates/TableBulkActionsTable/', 'Admin', 'eve@example.com'],
		['/templates/TableFloatingBulkActionsTable/', 'Active users', 'Pending reviews'],
	]
	for (const [route, first, second] of flatCases) {
		await page.goto(baseUrl + route + (route.startsWith('/templates/table') ? '?embed=1' : ''), {
			waitUntil: 'networkidle',
		})

		await expect(page.locator('body')).toContainText(first)
		await expect(page.locator('body')).toContainText(second)
		const content = await page.locator('body').innerText()
		check(`Table block content ${route}`, content.includes(first) && content.includes(second))
	}

	const unit7Routes = [
		['/templates/StickyColumnsHookUsage/', 'Alice Johnson', 'On leave'],
		['/templates/TableGroupedRowsTable/', 'Design Systems', 'Leo Nash'],
		['/templates/TableRowExpansionTable/', 'Ada Lovelace', 'Mechanical keyboard'],
		['/templates/TableRowIndexTable/', 'Nightfall', 'Halcyon'],
		['/templates/TableRowStatusTable/', 'build-core', 'snapshot-review'],
		['/templates/TableTreeTable/', 'package.json', 'index.ts'],
	]
	for (const [route, needle, needle2] of unit7Routes) {
		await page.goto(baseUrl + route + (route.startsWith('/templates/table') ? '?embed=1' : ''), {
			waitUntil: 'networkidle',
		})

		await expect(page.locator('body')).toContainText(needle)
		await expect(page.locator('body')).toContainText(needle2)
		const hit = await page.locator(`text=${needle}`).count()
		const hit2 = await page.locator(`text=${needle2}`).count()
		check(`unit-7 route ${route}`, hit > 0 && hit2 > 0, `${hit}/${hit2} needles`)
	}

	// Grouped rows: chevron collapses a group (member rows hidden, header
	// remains, aria-expanded flips); row-click re-expands it.
	await page.goto(baseUrl + '/templates/TableGroupedRowsTable/', { waitUntil: 'networkidle' })
	check(
		'unit-7 grouped headers render',
		(await page.locator('.vx-table-row--group-header').count()) === 3,
	)
	const designHeader = page.locator('.vx-table-row--group-header', { hasText: 'Design Systems' })
	await designHeader.locator('button.vx-table-chevron').click()
	await page.waitForTimeout(300)
	check(
		'unit-7 grouped chevron collapses rows',
		(await page.locator('text=Ava Chen').count()) === 0 && (await designHeader.count()) === 1,
	)
	check(
		'unit-7 grouped header aria-expanded false',
		(await designHeader.getAttribute('aria-expanded')) === 'false',
	)
	await designHeader.click()
	await page.waitForTimeout(300)
	check(
		'unit-7 grouped row-click re-expands',
		(await page.locator('text=Ava Chen').count()) > 0 &&
			(await designHeader.getAttribute('aria-expanded')) === 'true',
	)

	// Row expansion: ord-1001 panel is open initially; a second row's chevron
	// opens its panel; collapsing hides it again.
	await page.goto(baseUrl + '/templates/TableRowExpansionTable/', { waitUntil: 'networkidle' })
	await page
		.locator('tr.vx-table-expanded-row', { hasText: 'Mechanical keyboard' })
		.waitFor({ state: 'attached' })
	check(
		'unit-7 expansion initial panel',
		(await page.locator('tr.vx-table-expanded-row', { hasText: 'Mechanical keyboard' }).count()) ===
			1,
	)
	const expanders = page.locator('tbody button.vx-table-expander')
	await expanders.nth(1).click()
	await page.waitForTimeout(300)
	check(
		'unit-7 expansion opens second panel',
		(await page.locator('tr.vx-table-expanded-row', { hasText: 'USB-C cable' }).count()) === 1,
	)
	await expanders.nth(0).click()
	await page.waitForTimeout(300)
	check(
		'unit-7 expansion collapse hides panel',
		(await page.locator('tr.vx-table-expanded-row', { hasText: 'Mechanical keyboard' }).count()) ===
			0,
	)

	// Row index: 1..5 ordinals down the gutter column.
	await page.goto(baseUrl + '/templates/TableRowIndexTable/', { waitUntil: 'networkidle' })
	await page.locator('tbody .vx-table-rowindex').nth(4).waitFor({ state: 'attached' })
	await expect(page.locator('tbody .vx-table-rowindex')).toHaveText(['1', '2', '3', '4', '5'])
	const indexTexts = await page.locator('tbody .vx-table-rowindex').allTextContents()
	check(
		'unit-7 row index ordinals 1..5',
		JSON.stringify(indexTexts.map((t) => t.trim())) === JSON.stringify(['1', '2', '3', '4', '5']),
		indexTexts.join(','),
	)

	// Row status: six labelled markers.
	await page.goto(baseUrl + '/templates/TableRowStatusTable/', { waitUntil: 'networkidle' })
	await page
		.locator('[role="image"][aria-label], [role="img"][aria-label]')
		.nth(5)
		.waitFor({ state: 'attached' })
	await expect(page.locator('[role="image"][aria-label], [role="img"][aria-label]')).toHaveCount(6)
	const statusLabels = await page
		.locator('[role="image"][aria-label], [role="img"][aria-label]')
		.all()
	const statusLabelTexts = []
	for (const m of statusLabels) {
		statusLabelTexts.push(await m.getAttribute('aria-label'))
	}
	check(
		'unit-7 row status markers labelled',
		statusLabels.length === 6 &&
			statusLabelTexts.includes('Failed') &&
			statusLabelTexts.includes('Needs attention'),
		statusLabelTexts.join(','),
	)

	// Tree: src expanded initially → components/index.ts at aria-level 2;
	// expanding components reveals Button.tsx at level 3; expand-all then
	// collapse-all.
	await page.goto(baseUrl + '/templates/TableTreeTable/', { waitUntil: 'networkidle' })
	const treeLevel = async (name) =>
		page.locator('tbody tr', { hasText: name }).first().getAttribute('aria-level')
	check(
		'unit-7 tree initial levels',
		(await treeLevel('components')) === '2' && (await treeLevel('index.ts')) === '2',
	)
	await page
		.locator('tbody tr', { hasText: 'components' })
		.first()
		.locator('button.vx-table-expander')
		.click()
	await page.waitForTimeout(300)
	check('unit-7 tree expands components', (await treeLevel('Button.tsx')) === '3')
	const expandAllToggle = page.locator('thead button.vx-table-expander')
	await expandAllToggle.click()
	await page.waitForTimeout(300)
	check('unit-7 tree collapse-all', (await page.locator('tbody tr').count()) === 2)
	check(
		'unit-7 tree collapse-all label',
		(await expandAllToggle.getAttribute('aria-label')) === 'Expand all rows',
	)
	await expandAllToggle.click()
	await page.waitForTimeout(300)
	check(
		'unit-7 tree expand-all',
		(await page.locator('tbody tr', { hasText: 'Table.tsx' }).count()) === 1,
	)

	// Sticky columns: horizontal scroll keeps the pinned Name cell fixed while
	// a middle column moves; the start shadow var flips to '1'.
	await page.goto(baseUrl + '/templates/StickyColumnsHookUsage/', { waitUntil: 'networkidle' })
	await page.locator('tbody td.vx-table-cell--sticky-start').first().waitFor({ state: 'attached' })
	const scroller = page.locator('.vx-table-scroll').first()
	const before = await page.evaluate(() => {
		const s = document.querySelector('.vx-table-scroll')
		const n = document.querySelector('tbody td.vx-table-cell--sticky-start')
		const m = [...document.querySelectorAll('tbody tr:first-child td')].find((td) =>
			td.textContent.includes('alice@example.com'),
		)
		return {
			sLeft: s.getBoundingClientRect().left,
			nameLeft: n.getBoundingClientRect().left,
			midLeft: m.getBoundingClientRect().left,
		}
	})
	await scroller.evaluate((el) => {
		el.scrollLeft = 300
	})
	await page.waitForTimeout(300)
	const after = await page.evaluate(() => {
		const s = document.querySelector('.vx-table-scroll')
		const n = document.querySelector('tbody td.vx-table-cell--sticky-start')
		const m = [...document.querySelectorAll('tbody tr:first-child td')].find((td) =>
			td.textContent.includes('alice@example.com'),
		)
		return {
			sLeft: s.getBoundingClientRect().left,
			nameLeft: n.getBoundingClientRect().left,
			midLeft: m.getBoundingClientRect().left,
			shadowStart: s.style.getPropertyValue('--table-sticky-shadow-start'),
		}
	})
	check(
		'unit-7 sticky start column pinned',
		Math.abs(after.nameLeft - after.sLeft - (before.nameLeft - before.sLeft)) < 2 &&
			after.midLeft < before.midLeft - 100,
		`name ${before.nameLeft - before.sLeft}→${after.nameLeft - after.sLeft} mid ${before.midLeft}→${after.midLeft}`,
	)
	check('unit-7 sticky shadow var flips', after.shadowStart === '1', `shadow=${after.shadowStart}`)

	for (const [route, needle] of [
		['/templates/table/', 'Item One'],
		['/templates/table-page/', 'Invoice INV-2043'],
		['/templates/table-grouped/', 'Update user interface'],
		['/templates/table-tree/', 'canvas-editor'],
		['/templates/table-inbox/', 'Checkout returns 502'],
		['/templates/table-filter/', 'Service jobs'],
		['/pages/table-overview/', 'Review streak'],
		['/pages/table-lab/', '500 rendered rows'],
	]) {
		await page.goto(baseUrl + route + (route.startsWith('/templates/table') ? '?embed=1' : ''), {
			waitUntil: 'networkidle',
		})

		await expect(page.locator('body')).toContainText(needle)
		check(
			`unit-7 composed content ${route}`,
			(await page.locator('body').innerText()).includes(needle),
		)
	}

	await page.goto(baseUrl + '/templates/table-grouped/?embed=1', { waitUntil: 'networkidle' })
	await page.getByRole('button', { name: 'Create issue', exact: true }).click()
	check('unit-7 grouped create dialog opens', (await page.getByRole('dialog').count()) === 1)
	await page.getByRole('button', { name: 'Cancel', exact: true }).click()
	check('unit-7 grouped create dialog closes', (await page.getByRole('dialog').count()) === 0)

	await page.goto(baseUrl + '/templates/table-tree/?embed=1', { waitUntil: 'networkidle' })
	await page
		.getByRole('textbox', { name: 'Search repository', exact: true })
		.fill('NOT-A-REPO-FILE')
	await page.getByText('No data', { exact: true }).waitFor()
	check(
		'unit-7 repository empty search',
		(await page.locator('tbody').first().locator('tr.vx-table-row').count()) === 0,
	)
	await page.getByRole('textbox', { name: 'Search repository', exact: true }).fill('ci.yml')
	check(
		'unit-7 repository search retains ancestors',
		(await page.locator('tbody').first().innerText()).includes('.github') &&
			(await page.locator('tbody').first().innerText()).includes('ci.yml'),
	)

	await verifyRepositoryKeyboard(page, baseUrl, check)

	await page.goto(baseUrl + '/templates/table-inbox/?embed=1', { waitUntil: 'networkidle' })
	await page.getByRole('button', { name: 'Reply', exact: true }).click()
	check(
		'unit-7 inbox reply prefilled',
		(await page.locator('.vx-token').count()) > 0 &&
			(await page.getByRole('textbox', { name: 'Subject', exact: true }).inputValue()).startsWith(
				'Re:',
			),
	)
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Draft text')
	await page.getByRole('button', { name: 'Close composer', exact: true }).click()
	await page.getByRole('button', { name: 'Compose', exact: true }).click()
	check(
		'unit-7 inbox retains draft on close',
		(await page.getByRole('textbox', { name: 'Message', exact: true }).inputValue()) ===
			'Draft text',
	)
	await page.getByRole('button', { name: 'Discard draft', exact: true }).click()
	await page.getByRole('button', { name: 'Compose', exact: true }).click()
	check(
		'unit-7 inbox discards draft',
		(await page.getByRole('textbox', { name: 'Message', exact: true }).inputValue()) === '',
	)

	await page.setViewportSize({ width: 560, height: 800 })
	await page.goto(baseUrl + '/templates/table-inbox/?embed=1', { waitUntil: 'networkidle' })
	check(
		'unit-7 narrow inbox starts with list',
		(await page.locator('table').count()) === 1 &&
			(await page.getByRole('button', { name: 'Close conversation', exact: true }).count()) === 0,
	)
	await page
		.getByRole('button', { name: 'Checkout returns 502 for EU customers', exact: true })
		.click()
	check(
		'unit-7 narrow inbox opens conversation surface',
		(await page.locator('table').count()) === 0 &&
			(await page.getByRole('button', { name: 'Close conversation', exact: true }).count()) === 1,
	)
	await page.getByRole('button', { name: 'Close conversation', exact: true }).click()
	check('unit-7 narrow inbox returns to list', (await page.locator('table').count()) === 1)
	await page.setViewportSize({ width: 1280, height: 800 })

	await page.goto(baseUrl + '/templates/table-filter/?embed=1', { waitUntil: 'networkidle' })
	await page.getByRole('textbox', { name: 'Search jobs', exact: true }).fill('NOT-A-SERVICE-JOB')
	await page.getByText('No data', { exact: true }).waitFor()
	check(
		'unit-7 service jobs empty search',
		(await page.locator('tbody tr.vx-table-row').count()) === 0,
	)
	await page.getByRole('button', { name: 'Clear all', exact: true }).click()
	check('unit-7 service jobs clear search', (await page.locator('tbody tr').count()) > 0)

	await page.getByRole('button', { name: 'Saved views', exact: true }).click()
	await page.getByRole('textbox', { name: 'View name', exact: true }).fill('Saved sample')
	await page.getByRole('button', { name: 'Create saved view', exact: true }).click()
	check(
		'unit-7 saves complete view snapshot',
		(await page.getByRole('button', { name: 'Saved sample', exact: true }).count()) === 1,
	)
	await page.getByRole('button', { name: 'Edit Saved sample', exact: true }).click()
	await page.getByRole('textbox', { name: 'View name', exact: true }).fill('Renamed sample')
	await page.getByRole('button', { name: 'Save view', exact: true }).click()
	check(
		'unit-7 edits saved view',
		(await page.getByRole('button', { name: 'Renamed sample', exact: true }).count()) === 1,
	)
	await page.getByRole('button', { name: 'Delete Renamed sample', exact: true }).click()
	check(
		'unit-7 deletes saved view',
		(await page.getByRole('button', { name: 'Renamed sample', exact: true }).count()) === 0,
	)

	await page.goto(baseUrl + '/pages/table-overview/', { waitUntil: 'networkidle' })
	await page.getByRole('textbox', { name: 'Search', exact: true }).fill('NOT-A-REVIEW')
	check(
		'unit-7 overview search hides empty groups',
		(await page.locator('.vx-collapsible').count()) === 0,
	)

	await page.goto(baseUrl + '/pages/table-lab/', { waitUntil: 'networkidle' })
	await page.getByRole('radio', { name: '50', exact: true }).click()
	check(
		'unit-7 lab switches dataset',
		(await page.locator('body').innerText()).includes('50 rendered rows'),
	)
	await page.getByRole('checkbox', { name: 'Pagination', exact: true }).check()
	check('unit-7 lab composes pagination', (await page.locator('tbody tr').count()) === 25)
	await page.getByRole('checkbox', { name: 'Pagination', exact: true }).uncheck()
	await page.getByRole('button', { name: 'Run scroll test', exact: true }).click()
	await page.getByRole('button', { name: 'Run scroll test', exact: true }).waitFor()
	check(
		'unit-7 lab samples scroll frames',
		!(await page.locator('body').innerText()).includes('Frames sampled: 0'),
	)
}

export async function verifyRepositoryKeyboard(page, baseUrl, check) {
	await page.goto(baseUrl + '/templates/table-tree/?embed=1', { waitUntil: 'networkidle' })
	await page.getByRole('textbox', { name: 'Search repository', exact: true }).fill('ci.yml')
	await page.locator('tbody tr.vx-table-row', { hasText: 'ci.yml' }).waitFor({ state: 'attached' })
	await page.locator('tbody tr.vx-table-row').first().press('End')
	check(
		'unit-7 repository End key focuses final visible row',
		(await page.evaluate(() => document.activeElement?.textContent ?? '')).includes('ci.yml'),
	)
	await page.locator('tbody tr.vx-table-row:focus').press('ArrowLeft')
	check(
		'unit-7 repository Left key focuses parent',
		(await page.evaluate(() => document.activeElement?.textContent ?? '')).includes('workflows'),
	)
}
