/** Small uncompressed GIF fixture, with original variable frame timing. */
export function gifBytes({
  width = 16,
  height = 16,
  frames = [
    [0, 10, 1, false],
    [2, 30, 3, true],
    [1, 20, 2, false],
  ],
} = {}) {
  const bytes = [
    ...new TextEncoder().encode('GIF89a'),
    width & 255,
    width >> 8,
    height & 255,
    height >> 8,
    0x81,
    0,
    0,
    255,
    0,
    0,
    0,
    0,
    255,
    0,
    0,
    0,
    0,
    255,
    0,
  ]

  for (const [color, delay, disposal, transparent] of frames) {
    bytes.push(
      0x21,
      0xf9,
      4,
      (disposal << 2) | (transparent ? 1 : 0),
      delay & 255,
      delay >> 8,
      2,
      0,
      0x2c,
      0,
      0,
      0,
      0,
      width & 255,
      width >> 8,
      height & 255,
      height >> 8,
      0,
      2,
    )

    let bits = 0,
      used = 0

    const compressed = []
    const code = (value) => {
      bits |= value << used
      used += 3
      while (used >= 8) {
        compressed.push(bits & 255)
        bits >>= 8
        used -= 8
      }
    }

    for (let pixel = 0; pixel < width * height; pixel++) {
      code(4)
      code(color)
    }

    code(5)
    if (used) {
      compressed.push(bits & 255)
    }

    for (let offset = 0; offset < compressed.length; offset += 255) {
      const block = compressed.slice(offset, offset + 255)

      bytes.push(block.length, ...block)
    }

    bytes.push(0)
  }

  bytes.push(0x3b)
  return new Uint8Array(bytes)
}
