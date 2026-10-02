import { describe, expect, it } from 'vitest'
import { fileAccepts, validateFiles } from './file-input-utils'

describe('file validation', () => {
	it('matches accept tokens', () => {
		expect(fileAccepts({ name: 'a.png', uri: 'x' }, '.png')).toBe(true)
		expect(fileAccepts({ name: 'a.jpg', uri: 'x' }, '.png')).toBe(false)
		expect(fileAccepts({ name: 'a.png', uri: 'x', mimeType: 'image/png' }, 'image/*')).toBe(true)
	})

	it('enforces maxSize and maxFiles', () => {
		const files = [
			{ name: 'a', uri: 'a', size: 10 },
			{ name: 'b', uri: 'b', size: 99999 },
			{ name: 'c', uri: 'c' },
		]

		const result = validateFiles(files, { maxSize: 100, maxFiles: 1 })
		expect(result.valid.map((file) => file.name)).toEqual(['a'])
		expect(result.errors).toHaveLength(2)
	})
})
