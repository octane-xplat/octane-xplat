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
})
