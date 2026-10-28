import { afterEach, expect, it, vi } from 'vitest'
const { writeText } = vi.hoisted(() => ({ writeText: vi.fn() }))
vi.mock('@octane-xplat/platform', () => ({ clipboard: { writeText } }))
import { copyText } from './clipboard-write.macos'

afterEach(() => writeText.mockReset())

it('uses the AppKit platform writer without requiring a read capability', async () => {
	writeText.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
	expect(await copyText('Copied ✓')).toBe(true)
	expect(await copyText('Denied')).toBe(false)
	expect(writeText.mock.calls).toEqual([['Copied ✓'], ['Denied']])
})
