// Parity screenshot compare — pairs per-cell crops from
// parity-report/shots/web and parity-report/shots/macos (produced by
// apps/web/scripts/parity-shots.mjs and apps/macos/scripts/parity-shots.mjs
// plus a window capturer), then ranks fixtures by pixel difference.
// Dependency-free: PNG decode/encode over node:zlib.
//
// Usage: node scripts/parity-shots-compare.mjs [--diffs] [--json]
//   --diffs  write amplified diff PNGs next to the crops
//   --json   print the raw report instead of the ranked table
import { inflateSync, deflateSync } from 'node:zlib'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const shotsDir = join(repoDir, 'parity-report', 'shots')
const DIFFS = process.argv.includes('--diffs')
const JSON_OUT = process.argv.includes('--json')

// ---- minimal PNG codec (8-bit, non-interlaced, gray/RGB/RGBA) ----

function paeth(a, b, c) {
	const p = a + b - c
	const pa = Math.abs(p - a)
	const pb = Math.abs(p - b)
	const pc = Math.abs(p - c)
	return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

function decodePng(buf) {
	if (buf.readUInt32BE(0) !== 0x89504e47) {
		throw new Error('not a PNG')
	}

	let pos = 8
	let w = 0
	let h = 0
	let colorType = 0
	let bitDepth = 0
	let interlace = 0
	const idat = []
	while (pos < buf.length) {
		const len = buf.readUInt32BE(pos)
		const type = buf.toString('ascii', pos + 4, pos + 8)
		const data = buf.subarray(pos + 8, pos + 8 + len)
		if (type === 'IHDR') {
			w = data.readUInt32BE(0)
			h = data.readUInt32BE(4)
			bitDepth = data[8]
			colorType = data[9]
			interlace = data[12]
		} else if (type === 'IDAT') {
			idat.push(data)
		} else if (type === 'IEND') {
			break
		}

		pos += 12 + len
	}

	if (bitDepth !== 8 || interlace !== 0) {
		throw new Error(`unsupported PNG depth=${bitDepth} interlace=${interlace}`)
	}

	const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType]
	if (!channels) {
		throw new Error('unsupported PNG color type ' + colorType)
	}

	const stride = w * channels
	const raw = inflateSync(Buffer.concat(idat))
	const px = Buffer.alloc(h * stride)
	let prev = Buffer.alloc(stride)
	for (let y = 0; y < h; y++) {
		const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
		const filter = raw[y * (stride + 1)]
		const out = px.subarray(y * stride, (y + 1) * stride)
		for (let x = 0; x < stride; x++) {
			const left = x >= channels ? out[x - channels] : 0
			const up = prev[x]
			const upLeft = x >= channels ? prev[x - channels] : 0
			const v = row[x]
			out[x] =
				filter === 0
					? v
					: filter === 1
						? (v + left) & 0xff
						: filter === 2
							? (v + up) & 0xff
							: filter === 3
								? (v + ((left + up) >> 1)) & 0xff
								: (v + paeth(left, up, upLeft)) & 0xff
		}

		prev = out
	}

	// normalize to RGBA
	const rgba = Buffer.alloc(w * h * 4)
	for (let i = 0; i < w * h; i++) {
		const s = i * channels
		if (colorType === 6) {
			rgba[i * 4] = px[s]
			rgba[i * 4 + 1] = px[s + 1]
			rgba[i * 4 + 2] = px[s + 2]
			rgba[i * 4 + 3] = px[s + 3]
		} else if (colorType === 2) {
			rgba[i * 4] = px[s]
			rgba[i * 4 + 1] = px[s + 1]
			rgba[i * 4 + 2] = px[s + 2]
			rgba[i * 4 + 3] = 255
		} else if (colorType === 0) {
			rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = px[s]
			rgba[i * 4 + 3] = 255
		} else if (colorType === 4) {
			rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = px[s]
			rgba[i * 4 + 3] = px[s + 1]
		}
	}

	return { w, h, data: rgba }
}

function crc32(buf) {
	let table = crc32.table
	if (!table) {
		table = crc32.table = new Uint32Array(256)
		for (let n = 0; n < 256; n++) {
			let c = n
			for (let k = 0; k < 8; k++) {
				c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
			}

			table[n] = c >>> 0
		}
	}

	let c = 0xffffffff
	for (let i = 0; i < buf.length; i++) {
		c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
	}

	return (c ^ 0xffffffff) >>> 0
}

function encodePng({ w, h, data }) {
	const stride = w * 4
	const raw = Buffer.alloc(h * (stride + 1))
	for (let y = 0; y < h; y++) {
		raw[y * (stride + 1)] = 0
		data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
	}

	const chunk = (type, payload) => {
		const out = Buffer.alloc(12 + payload.length)
		out.writeUInt32BE(payload.length, 0)
		out.write(type, 4)
		payload.copy(out, 8)
		out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), payload])), 8 + payload.length)
		return out
	}

	const ihdr = Buffer.alloc(13)
	ihdr.writeUInt32BE(w, 0)
	ihdr.writeUInt32BE(h, 4)
	ihdr[8] = 8
	ihdr[9] = 6
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0)),
	])
}

function crop(img, x, y, w, h) {
	const out = Buffer.alloc(w * h * 4)
	for (let row = 0; row < h; row++) {
		const sy = y + row
		for (let col = 0; col < w; col++) {
			const sx = x + col
			if (sx < 0 || sy < 0 || sx >= img.w || sy >= img.h) {
				continue
			}

			img.data.copy(out, (row * w + col) * 4, (sy * img.w + sx) * 4, (sy * img.w + sx) * 4 + 4)
		}
	}

	return { w, h, data: out }
}

// ---- pairing ----

const webManifest = JSON.parse(readFileSync(join(shotsDir, 'web', 'manifest.json'), 'utf8'))
const macosManifest = JSON.parse(readFileSync(join(shotsDir, 'macos', 'manifest.json'), 'utf8'))
const webScale = webManifest.viewport.scale

const webShots = new Map()
for (const shot of webManifest.shots) {
	webShots.set(shot.file, decodePng(readFileSync(join(shotsDir, 'web', shot.file))))
}

const macosSidecars = new Map()
for (const shot of macosManifest.shots) {
	macosSidecars.set(
		shot.file,
		JSON.parse(readFileSync(join(shotsDir, 'macos', shot.cellsFile), 'utf8')),
	)
}

// pick each cell's best shot: fully visible, nearest the top of the
// viewport (cells pinned high carry the least clipped-context risk)
function pickWeb(name) {
	let best = null
	for (const shot of webManifest.shots) {
		const cell = shot.cells[name]
		if (!cell?.visible) {
			continue
		}

		if (!best || cell.y < best.cell.y) {
			best = { shot, cell }
		}
	}

	return best
}

function pickMacos(name) {
	let best = null
	for (const shot of macosManifest.shots) {
		const side = macosSidecars.get(shot.file)
		const cell = side?.cells.find((c) => c.name === name)
		if (!cell) {
			continue
		}

		// window coords are y-up inside the frame; fully visible iff the
		// rect sits inside the scrollview's window rect
		const sv = side.scrollWindow
		const topInWindow = cell.window.y + cell.window.h
		const scrollTopInWindow = sv.y + sv.h
		const visible = cell.window.y >= sv.y && topInWindow <= scrollTopInWindow && cell.window.w > 0

		if (!visible) {
			continue
		}

		// distance of the cell top below the scrollview top, in points
		const topDist = scrollTopInWindow - topInWindow
		if (!best || topDist < best.topDist) {
			best = { shot, cell, side, topDist }
		}
	}

	return best
}

const names = new Set()
for (const shot of webManifest.shots) {
	for (const name of Object.keys(shot.cells)) {
		names.add(name)
	}
}

const macosCache = new Map()
const macosImage = (file) => {
	if (!macosCache.has(file)) {
		macosCache.set(file, decodePng(readFileSync(join(shotsDir, 'macos', file))))
	}

	return macosCache.get(file)
}

const THRESHOLD = 16 // per-channel delta counted as a differing pixel
const report = []
const diffsDir = join(shotsDir, 'diffs')
if (DIFFS) {
	mkdirSync(diffsDir, { recursive: true })
}

for (const name of [...names].sort()) {
	const webPick = pickWeb(name)
	const macPick = pickMacos(name)
	if (!webPick || !macPick) {
		report.push({
			name,
			error: !webPick ? 'not fully visible in any web shot' : 'not fully visible in any macOS shot',
		})

		continue
	}

	const webImg = webShots.get(webPick.shot.file)
	const wRect = webPick.cell
	const wCrop = crop(
		webImg,
		Math.round(wRect.x * webScale),
		Math.round(wRect.y * webScale),
		Math.round(wRect.w * webScale),
		Math.round(wRect.h * webScale),
	)

	const macImg = macosImage(macPick.shot.file)
	const mScale = macImg.w / (macPick.side.scrollWindow.w || 640) // px per point
	const mRect = macPick.cell.window
	// window y is up from the frame's bottom edge → flip to image rows
	const mCrop = crop(
		macImg,
		Math.round(mRect.x * mScale),
		Math.round(macImg.h - (mRect.y + mRect.h) * mScale),
		Math.round(mRect.w * mScale),
		Math.round(mRect.h * mScale),
	)

	const cw = Math.min(wCrop.w, mCrop.w)
	const ch = Math.min(wCrop.h, mCrop.h)
	let diffPixels = 0
	let sumAbs = 0
	const diffImg = DIFFS ? Buffer.alloc(cw * ch * 4) : null
	for (let i = 0; i < cw * ch; i++) {
		const d = Math.max(
			Math.abs(wCrop.data[i * 4] - mCrop.data[i * 4]),
			Math.abs(wCrop.data[i * 4 + 1] - mCrop.data[i * 4 + 1]),
			Math.abs(wCrop.data[i * 4 + 2] - mCrop.data[i * 4 + 2]),
		)

		sumAbs += d
		if (d > THRESHOLD) {
			diffPixels++
		}

		if (diffImg) {
			diffImg[i * 4] = Math.min(255, d * 4)
			diffImg[i * 4 + 1] = 0
			diffImg[i * 4 + 2] = 0
			diffImg[i * 4 + 3] = 255
		}
	}

	if (diffImg) {
		writeFileSync(join(diffsDir, name + '.png'), encodePng({ w: cw, h: ch, data: diffImg }))
		writeFileSync(join(diffsDir, name + '.web.png'), encodePng(crop(wCrop, 0, 0, cw, ch)))
		writeFileSync(join(diffsDir, name + '.macos.png'), encodePng(crop(mCrop, 0, 0, cw, ch)))
	}

	report.push({
		name,
		webSize: `${wCrop.w}x${wCrop.h}`,
		macosSize: `${mCrop.w}x${mCrop.h}`,
		sizeDelta: `${mCrop.w - wCrop.w}x${mCrop.h - wCrop.h}`,
		diffPct: Number(((diffPixels / (cw * ch)) * 100).toFixed(1)),
		meanAbs: Number((sumAbs / (cw * ch)).toFixed(1)),
		webShot: webPick.shot.file,
		macosShot: macPick.shot.file,
	})
}

if (JSON_OUT) {
	console.log(JSON.stringify(report, null, 2))
} else {
	const rows = report.slice().sort((a, b) => (b.diffPct ?? -1) - (a.diffPct ?? -1))

	console.log(
		'fixture'.padEnd(24) + 'diff%'.padStart(7) + '  meanAbs  webSize    macosSize   sizeDelta',
	)

	for (const r of rows) {
		if (r.error) {
			console.log(r.name.padEnd(24) + '  ' + r.error)
			continue
		}

		console.log(
			r.name.padEnd(24) +
				String(r.diffPct).padStart(7) +
				String(r.meanAbs).padStart(9) +
				'  ' +
				r.webSize.padEnd(10) +
				' ' +
				r.macosSize.padEnd(10) +
				' ' +
				r.sizeDelta,
		)
	}

	const measured = report.filter((r) => !r.error)
	console.log(`\n${measured.length}/${report.length} fixtures compared`)
}
