import { describe, expect, it } from 'vitest'
import { isSafeDestination, sanitizeUrl } from './safe-url'

describe('sanitizeUrl', () => {
	it('blocks script and HTML data schemes, including control-character obfuscation', () => {
		expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
		expect(sanitizeUrl('java\nscript:alert(1)')).toBeNull()
		expect(sanitizeUrl('data:text/html,<script>')).toBeNull()
	})

	it('blocks dangerous schemes spelled with spaces after the scheme colon', () => {
		// A data URL's media type ignores whitespace after the scheme colon, so
		// `data: text/html` navigates as an HTML document.
		expect(sanitizeUrl('data: text/html,<script>alert(1)</script>')).toBeNull()
		expect(sanitizeUrl('data:   text/html,<script>alert(1)</script>')).toBeNull()
		expect(sanitizeUrl('DATA: TEXT/HTML,<script>alert(1)</script>')).toBeNull()
		// Leading space in a script body is still executable script.
		expect(sanitizeUrl('javascript: alert(1)')).toBeNull()
		expect(sanitizeUrl('vbscript: msgbox(1)')).toBeNull()
	})

	it('keeps ordinary web URLs unchanged', () => {
		expect(sanitizeUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1')
		expect(sanitizeUrl(' https://example.com/guide\n')).toBe('https://example.com/guide')
		expect(sanitizeUrl('mailto:a@example.com')).toBe('mailto:a@example.com')
		expect(sanitizeUrl('/app-relative/path')).toBe('/app-relative/path')
		// Only data:text/html is blocked; other data media types pass.
		expect(sanitizeUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(
			'data:image/png;base64,iVBORw0KGgo=',
		)
		// Accepted inputs are returned normalized, never rewritten to the
		// scheme-collapsed comparison form.
		expect(sanitizeUrl('custom-scheme: spaced value')).toBe('custom-scheme: spaced value')
	})
})

describe('isSafeDestination', () => {
	it('rejects structured destinations that assemble a blocked scheme', () => {
		expect(isSafeDestination({ protocol: 'data', host: ' text/html', pathname: ',<script>' })).toBe(
			false,
		)
		expect(isSafeDestination({ protocol: 'javascript: alert' })).toBe(false)
		expect(isSafeDestination({ pathname: 'data: text/html,x' })).toBe(false)
	})

	it('accepts ordinary string and structured destinations', () => {
		expect(isSafeDestination('https://example.com')).toBe(true)
		expect(isSafeDestination({ protocol: 'https:', host: 'example.com', pathname: '/x' })).toBe(
			true,
		)
		expect(isSafeDestination(null)).toBe(true)
	})
})
