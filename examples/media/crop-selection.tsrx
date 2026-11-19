import { useState } from 'octane'
import { ImageCrop, toNaturalCrop, type Crop } from '@octane-xplat/image-crop'

export function PhotoSelection() @{
  // 1. Keep the selection as a percentage of the displayed image.
  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 25, y: 25, width: 50, height: 50 })

  // 2. Replace the URL and dimensions; use a local path or data URI on AppKit.
  <ImageCrop
    src="https://example.com/photo.jpg"
    alt="Photo to crop"
    imageWidth={1600}
    imageHeight={1200}
    width={400}
    height={300}
    crop={crop}
    aspect={4 / 3}
    onChange={(_, percent) => setCrop(percent)}
    onComplete={(pixel) => {
      // 3. Convert displayed pixels to natural image pixels for export.
      const natural = toNaturalCrop(pixel, { width: 400, height: 300 }, { width: 1600, height: 1200 })
      console.log(natural)
    }}
  />
}
