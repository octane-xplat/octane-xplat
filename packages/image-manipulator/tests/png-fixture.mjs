import assert from 'node:assert/strict'
import { deflateSync, inflateSync } from 'node:zlib'

const orientations = [
	[0, 1, 2, 3, 4, 5],
	[2, 1, 0, 5, 4, 3],
	[5, 4, 3, 2, 1, 0],
	[3, 4, 5, 0, 1, 2],
	[0, 3, 1, 4, 2, 5],
	[3, 0, 4, 1, 5, 2],
	[5, 2, 4, 1, 3, 0],
	[2, 5, 1, 4, 0, 3],
]

export function checkOrientations(samples) {
	assert.equal(samples.length, 8)
	const original = redsOf(samples.find((sample) => sample.orientation === 1).base64)
	for (const sample of samples) {
		assert.deepEqual([sample.width, sample.height], sample.orientation <= 4 ? [3, 2] : [2, 3])
		const actual = redsOf(sample.base64)
		const expected = orientations[sample.orientation - 1].map((index) => original[index])
		assert.ok(
			actual.every((value, index) => Math.abs(value - expected[index]) <= 1),
			`EXIF ${sample.orientation}: ${JSON.stringify(actual)} expected ${JSON.stringify(expected)}`,
		)
	}
}

export function png() {
	const chunk = (name, data) => {
		const type = Buffer.from(name)
		let crc = 0xffffffff
		for (const byte of Buffer.concat([type, data])) {
			crc ^= byte
			for (let bit = 0; bit < 8; bit++) {
				crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
			}
		}
		const size = Buffer.alloc(4),
			checksum = Buffer.alloc(4)
		size.writeUInt32BE(data.length)
		checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
		return Buffer.concat([size, type, data, checksum])
	}
	const header = Buffer.alloc(13)
	header.writeUInt32BE(3)
	header.writeUInt32BE(2, 4)
	header[8] = 8
	header[9] = 2
	const rows = Buffer.from([0, 20, 0, 0, 40, 0, 0, 60, 0, 0, 0, 80, 0, 0, 100, 0, 0, 120, 0, 0])
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(rows)),
		chunk('IEND', Buffer.alloc(0)),
	])
}

// Decode the test's non-interlaced 8-bit RGB/RGBA PNGs independently of AppKit.
// This checks saved bytes instead of depending on another native pixel accessor.
export function redsOf(base64) {
	const bytes = Buffer.from(base64, 'base64')
	assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
	const width = bytes.readUInt32BE(16),
		height = bytes.readUInt32BE(20)
	assert.equal(bytes[24], 8)
	assert.equal(bytes[28], 0)
	const channels = bytes[25] === 6 ? 4 : bytes[25] === 2 ? 3 : 0
	assert.ok(channels, 'expected RGB or RGBA PNG')
	const chunks = []
	for (let offset = 8; offset < bytes.length;) {
		const size = bytes.readUInt32BE(offset)
		if (bytes.toString('ascii', offset + 4, offset + 8) === 'IDAT') {
			chunks.push(bytes.subarray(offset + 8, offset + 8 + size))
		}
		offset += size + 12
	}
	const filtered = inflateSync(Buffer.concat(chunks))
	const stride = width * channels
	assert.equal(filtered.length, (stride + 1) * height)
	let previous = Buffer.alloc(stride)
	const reds = []
	for (let y = 0; y < height; y++) {
		const filter = filtered[y * (stride + 1)]
		assert.ok(filter <= 4)
		const row = Buffer.alloc(stride)
		for (let x = 0; x < stride; x++) {
			const left = x >= channels ? row[x - channels] : 0
			const up = previous[x],
				diagonal = x >= channels ? previous[x - channels] : 0
			const estimate = left + up - diagonal
			const distances = [
				Math.abs(estimate - left),
				Math.abs(estimate - up),
				Math.abs(estimate - diagonal),
			]
			const paeth =
				distances[0] <= distances[1] && distances[0] <= distances[2]
					? left
					: distances[1] <= distances[2]
						? up
						: diagonal
			const prediction = [0, left, up, Math.floor((left + up) / 2), paeth][filter]
			row[x] = (filtered[y * (stride + 1) + 1 + x] + prediction) & 255
		}
		for (let x = 0; x < width; x++) {
			reds.push(row[x * channels])
		}
		previous = row
	}
	return reds
}
