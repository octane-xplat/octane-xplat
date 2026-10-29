import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'

// The macOS leaf runs in a vm with stub Vision/AppKit globals — the
// platform import (which dlopens Vision) is stripped like haptics does.
const SOURCE = readFileSync(new URL('../src/barcode-scanner.macos.ts', import.meta.url), 'utf8')
	.replace(/import[\s\S]*?from '@octane-xplat\/platform\/macos'/, '')
	.replace(/import type.*\n/, '')
	.replace('export const', 'const')

// vm-realm objects trip strict prototype checks — compare plain copies.
const plain = (value: unknown) => JSON.parse(JSON.stringify(value))

function fixture() {
	const calls: { paths: string[]; urls: string[] } = { paths: [], urls: [] }
	const request: any = { symbologies: undefined, results: [] }
	const state = { performed: true }
	const image = () => ({ CGImageForProposedRectContextHints: () => 'cg' })
	const context = vm.createContext({
		NSURL: {
			fileURLWithPath: (path: string) => {
				calls.paths.push(path)
				return { path }
			},
			URLWithString: (url: string) => {
				calls.urls.push(url)
				return { url }
			},
		},
		NSImage: {
			alloc: () => ({
				initWithContentsOfURL: (url: any) => (url?.path?.includes('missing') ? null : image()),
			}),
		},
		CGImageGetWidth: () => 200,
		CGImageGetHeight: () => 100,
		VNDetectBarcodesRequest: { alloc: () => ({ init: () => request }) },
		VNImageRequestHandler: {
			alloc: () => ({ initWithCGImageOptions: () => ({ performRequestsError: () => state.performed }) }),
		},
	})
	const scanner = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\nbarcodeScanner', context)
	return { scanner, calls, request, state, image, context }
}

const observation = (symbology: string, payloadStringValue: string, boundingBox?: any) => ({
	symbology,
	payloadStringValue,
	boundingBox,
})

test('a path scans QR symbologies and maps Vision bounds into image pixels', async () => {
	const f = fixture()
	f.request.results = [
		observation('VNBarcodeSymbologyQR', 'HELLO', {
			origin: { x: 0.25, y: 0.5 },
			size: { width: 0.5, height: 0.25 },
		}),
	]
	const codes = await f.scanner.scanImage('/tmp/qr.png', ['qr'])
	assert.deepEqual(f.calls.paths, ['/tmp/qr.png'])
	assert.deepEqual(f.calls.urls, [])
	assert.deepEqual(plain(f.request.symbologies), ['VNBarcodeSymbologyQR'])
	assert.deepEqual(plain(codes), [
		{ type: 'qr', data: 'HELLO', bounds: { x: 50, y: 25, width: 100, height: 25 } },
	])

	// NSArray-shaped results (count/objectAtIndex) decode the same way.
	f.request.results = { count: 1, objectAtIndex: (i: number) => [observation('VNBarcodeSymbologyQR', 'RAW')][i] }
	assert.deepEqual(plain(await f.scanner.scanImage('/tmp/qr.png', ['qr'])), [{ type: 'qr', data: 'RAW' }])
})

test('file URLs, {uri} refs and duck-typed NSImages pick the right input path', async () => {
	const f = fixture()
	await f.scanner.scanImage('file:///tmp/a.png', ['qr'])
	assert.deepEqual(f.calls.urls, ['file:///tmp/a.png'])
	await f.scanner.scanImage({ uri: '/tmp/b.png' }, ['qr'])
	assert.deepEqual(f.calls.paths, ['/tmp/b.png'])
	await f.scanner.scanImage(f.image(), ['qr'])
	assert.deepEqual(f.calls.paths, ['/tmp/b.png'], 'NSImage input adds no NSURL calls')
	assert.deepEqual(f.calls.urls, ['file:///tmp/a.png'])
})

test('omitted formats request the full vocabulary and results map back', async () => {
	const f = fixture()
	f.request.results = [
		observation('VNBarcodeSymbologyEAN13', '0123456789012'),
		observation('VNBarcodeSymbologyEAN13', '4006381333931'),
		observation('VNBarcodeSymbologyCode39FullASCII', 'ABC'),
		observation('VNBarcodeSymbologyITF14', '04912345'),
	]
	const codes = await f.scanner.scanImage('/tmp/mixed.png')
	const symbologies = plain(f.request.symbologies)
	assert.equal(symbologies.filter((s: string) => s === 'VNBarcodeSymbologyCodabar').length, 1)
	assert.equal(symbologies.filter((s: string) => s === 'VNBarcodeSymbologyEAN13').length, 1)
	assert.deepEqual(plain(codes), [
		{ type: 'upc_a', data: '123456789012' },
		{ type: 'ean13', data: '4006381333931' },
		{ type: 'code39', data: 'ABC' },
		{ type: 'itf', data: '04912345' },
	])
})

test('a upc_a-only request drops genuine EAN-13s and unwraps leading-zero ones', async () => {
	const f = fixture()
	f.request.results = [
		observation('VNBarcodeSymbologyEAN13', '4006381333931'),
		observation('VNBarcodeSymbologyEAN13', '0123456789012'),
	]
	const codes = await f.scanner.scanImage('/tmp/upc.png', ['upc_a'])
	assert.deepEqual(plain(f.request.symbologies), ['VNBarcodeSymbologyEAN13'])
	assert.deepEqual(plain(codes), [{ type: 'upc_a', data: '123456789012' }])
})

test('scanImage rejects remote URLs, foreign inputs, unreadable images and Vision failures', async () => {
	const f = fixture()
	await assert.rejects(f.scanner.scanImage('https://x/y.png', ['qr']), /download remote images first/)
	await assert.rejects(f.scanner.scanImage(42, ['qr']), /expected a file path, file URL/)
	await assert.rejects(f.scanner.scanImage('/tmp/missing.png', ['qr']), /could not read the image/)
	f.state.performed = false
	await assert.rejects(f.scanner.scanImage('/tmp/qr.png', ['qr']), /Vision could not process the image/)
})

test('the service reports still-image support without a camera permission owner', async () => {
	const f = fixture()
	assert.equal(f.scanner.supported, true)
	assert.equal(await f.scanner.ensure(), 'unsupported')
	assert.equal(f.context.__xplatPermissionOwners, undefined)
})
