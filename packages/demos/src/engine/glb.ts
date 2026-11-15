/** Minimal binary-glTF container reader — enough to locate the JSON chunk
 *  and the BIN chunk so engines can decode embedded images themselves.
 *  Shared because it is pure byte math (no platform APIs). */
export interface GlbChunks {
  json: {
    images?: { uri?: string; bufferView?: number; mimeType?: string; name?: string }[]
    bufferViews?: { buffer: number; byteOffset?: number; byteLength: number }[]
    buffers?: { byteLength: number; uri?: string }[]
    textures?: { source?: number; sampler?: number; extensions?: Record<string, { source: number }> }[]
    materials?: {
      pbrMetallicRoughness?: {
        baseColorTexture?: { index: number }
        emissiveTexture?: never
      }
      emissiveTexture?: { index: number }
    }[]
    [key: string]: unknown
  }
  bin: Uint8Array
}

const GLB_MAGIC = 0x46546c67
const CHUNK_JSON = 0x4e4f534a
const CHUNK_BIN = 0x004e4942

export function parseGlb(arrayBuffer: ArrayBuffer): GlbChunks {
  const view = new DataView(arrayBuffer)
  if (view.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error('engine demo: not a .glb (bad magic)')
  }
  let offset = 12
  let jsonText: string | undefined
  let bin: Uint8Array | undefined
  const bytes = new Uint8Array(arrayBuffer)
  const decoder = new TextDecoder()
  while (offset + 8 <= view.byteLength) {
    const chunkLength = view.getUint32(offset, true)
    const chunkType = view.getUint32(offset + 4, true)
    const body = bytes.subarray(offset + 8, offset + 8 + chunkLength)
    if (chunkType === CHUNK_JSON) {
      jsonText = decoder.decode(body)
    } else if (chunkType === CHUNK_BIN) {
      bin = body
    }
    offset += 8 + chunkLength
  }
  if (!jsonText || !bin) {
    throw new Error(`engine demo: .glb missing ${!jsonText ? 'JSON' : 'BIN'} chunk`)
  }
  return { json: JSON.parse(jsonText), bin }
}

/** Byte range of one glTF bufferView inside the BIN chunk. */
export function bufferViewBytes(glb: GlbChunks, index: number): Uint8Array {
  const bufferView = glb.json.bufferViews?.[index]
  if (!bufferView || bufferView.buffer !== 0) {
    throw new Error(`engine demo: unsupported bufferView ${index} (external buffer)`)
  }
  const start = bufferView.byteOffset ?? 0
  return glb.bin.subarray(start, start + bufferView.byteLength)
}
