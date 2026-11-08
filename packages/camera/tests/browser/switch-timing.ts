import { Input, BlobSource, ALL_FORMATS, EncodedPacketSink } from 'mediabunny'

/** Container/packet evidence only: no image decoding or comparison. */
export async function movieTimeline(bytes: Blob) {
  const input = new Input({ source: new BlobSource(bytes), formats: ALL_FORMATS })

  try {
    const tracks = await input.getTracks()

    return await Promise.all(
      tracks.map(async (track) => {
        let first = Number.POSITIVE_INFINITY
        let last = 0
        let count = 0
        let previous = -1
        let maxGap = 0
        let monotonic = true

        for await (const packet of new EncodedPacketSink(track).packets()) {
          first = Math.min(first, packet.timestamp)
          last = Math.max(last, packet.timestamp + packet.duration)
          if (previous >= 0) {
            maxGap = Math.max(maxGap, packet.timestamp - previous)
          }

          monotonic &&= packet.timestamp >= previous
          previous = packet.timestamp
          count++
        }

        return { type: track.type, first, last, count, maxGap, monotonic }
      }),
    )
  } finally {
    input.dispose()
  }
}
