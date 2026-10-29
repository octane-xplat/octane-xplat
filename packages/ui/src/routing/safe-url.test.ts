import { describe, expect, it } from 'vitest'
import { sanitizeUrl } from './safe-url'

describe('sanitizeUrl', () => {
	it('blocks script and HTML data schemes, including control-character obfuscation', () => {
		expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
		expect(sanitizeUrl('java\nscript:alert(1)')).toBeNull()
		expect(sanitizeUrl('data:text/html,<script>')).toBeNull()
	})

	it('keeps ordinary web URLs unchanged', () => {
		expect(sanitizeUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1')
	})
})
