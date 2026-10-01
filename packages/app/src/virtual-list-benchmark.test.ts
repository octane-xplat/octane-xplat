import { describe, expect, it, vi } from 'vitest'
import { runVirtualListInputTrace, type VirtualListBenchSnapshot } from './virtual-list-benchmark'

describe('VirtualList input geometry evidence', () => {
	it('separates uncovered edges from internal gaps without claiming frame pacing', async () => {
		let clock = 0
		const now = vi.spyOn(performance, 'now').mockImplementation(() => clock)
		const snapshot: VirtualListBenchSnapshot = {
			offset: 200,
			viewportHeight: 100,
			mountedIndices: [4, 5],
			rows: [
				{ index: 4, top: 7, bottom: 40 },
				{ index: 5, top: 43, bottom: 89 },
			],
		}

		try {
			const result = await runVirtualListInputTrace(
				{
					target: 'ios',
					read: () => snapshot,
					wait: async () => {
						clock += 16
					},
				},
				32,
			)

			expect(result.coverage.gapSamples).toBe(2)
			expect(result.coverage.maxGap).toBe(11)
			expect(result.coverage.worstGeometry).toMatchObject({
				leadingGap: 7,
				trailingGap: 11,
				internalGap: 3,
			})

			expect(result.framePacing).toEqual({ status: 'not-collected', pollingIsFramePacing: false })
			snapshot.rows[0].top = 0
			expect(result.coverage.worstGeometry?.rows[0].top).toBe(7)
		} finally {
			now.mockRestore()
		}
	})

	it('counts header and separator boxes as coverage without adding mounted rows', async () => {
		let clock = 0
		const now = vi.spyOn(performance, 'now').mockImplementation(() => clock)
		const snapshot: VirtualListBenchSnapshot = {
			offset: 0, viewportHeight: 100, mountedIndices: [0, 1],
			rows: [{ index: 0, top: 10, bottom: 48 }, { index: 1, top: 50, bottom: 100 }],
			coverageBoxes: [{ top: 0, bottom: 10 }, { top: 10, bottom: 50 }, { top: 50, bottom: 100 }],
		}

		try {
			const result = await runVirtualListInputTrace({
				target: 'android', read: () => snapshot, wait: async () => { clock += 16 },
			}, 32, 500)

			expect(result.coverage.gapSamples).toBe(0)
			expect(result.mountedRows.max).toBe(2)
			expect(result.fixture.rowCount).toBe(500)
		} finally { now.mockRestore() }
	})

	it('distinguishes logical row churn from retained physical cell hosts', async () => {
		let clock = 0
		let moved = false
		const now = vi.spyOn(performance, 'now').mockImplementation(() => clock)
		try {
			const result = await runVirtualListInputTrace({
				target: 'android',
				read: () => ({ offset: moved ? 48 : 0, viewportHeight: 100,
					mountedIndices: moved ? [1, 2] : [0, 1], mountedCellIds: moved ? [2, 1] : [1, 2],
					rows: [{ index: moved ? 1 : 0, top: 0, bottom: 50 }, { index: moved ? 2 : 1, top: 50, bottom: 100 }],
				}),
				wait: async () => { clock += 16; moved = true },
			}, 16)

			expect(result.rowChurn).toEqual({ mounted: 1, unmounted: 1 })
			expect(result.cellHosts).toMatchObject({ status: 'collected', added: 0, removed: 0 })
		} finally { now.mockRestore() }
	})

	it('classifies bounce-region gaps as overscroll instead of content gaps', async () => {
		let clock = 0
		const now = vi.spyOn(performance, 'now').mockImplementation(() => clock)
		// UIScrollView rubber-band: offset past the content top shifts every row
		// down, so the viewport's leading edge is uncovered by design.
		const bounced: VirtualListBenchSnapshot = {
			offset: -40,
			viewportHeight: 100,
			mountedIndices: [0, 1],
			rows: [
				{ index: 0, top: 40, bottom: 80 },
				{ index: 1, top: 80, bottom: 99 },
			],
		}

		try {
			const result = await runVirtualListInputTrace(
				{
					target: 'ios',
					read: () => bounced,
					wait: async () => {
						clock += 16
					},
				},
				32,
			)

			expect(result.coverage.gapSamples).toBe(2)
			expect(result.coverage.overscrollGapSamples).toBe(2)
			expect(result.coverage.contentGapSamples).toBe(0)
			expect(result.coverage.maxContentGap).toBe(0)
			expect(result.coverage.worstGeometry?.overscroll).toBe(true)
		} finally {
			now.mockRestore()
		}
	})
})
