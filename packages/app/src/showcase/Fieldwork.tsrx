/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { useEffect, useRef, useState } from 'octane'
import { Button, HStack, Image, Text, TextArea, View, useMeasure$ } from '@octane-xplat/ui'
import { FileInput, files } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'
import { media } from '@octane-xplat/media'
import { share } from '@octane-xplat/share'
import { storage } from '@octane-xplat/platform'
import { ImageCrop, containFrame, toNaturalCrop } from '@octane-xplat/image-crop'
import type { Crop } from '@octane-xplat/image-crop'
import { ImageManipulator, SaveFormat, releaseImage } from '@octane-xplat/image-manipulator'
import type {
  ImageManipulatorContext,
  ImageRef,
  ImageResult,
} from '@octane-xplat/image-manipulator'

import { FIELD_SAMPLE } from './field-sample'

export function Fieldwork() @{
  const [file, setFile] = useState<FileInputFile | null>(null)
  const [source, setSource] = useState({
    uri: FIELD_SAMPLE,
    name: 'Ridge study',
    width: 800,
    height: 560,
  })

  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 10, y: 10, width: 80, height: 80 })
  const [result, setResult] = useState<ImageResult | null>(null)
  const [note, setNote] = useState(
    () =>
      storage.getString('showcase-field-note') ??
      'A new perspective on the north ridge. Keep the warm sky and the foreground together.',
  )

  const [message, setMessage] = useState(
    'A bundled original image is ready. Drag the crop, or import your own.',
  )

  const [busy, setBusy] = useState(false)
  const generation = useRef(0)
  const measure = useMeasure$()
  const cropWidth = Math.max(160, Math.min(480, measure.bounds$.get()?.width || 288))
  const cropHeight = Math.round(cropWidth * 0.75)

  useEffect(() => {
    storage.setString('showcase-field-note', note)
  }, [note])

  useEffect(
    () => () => {
      if (result) {
        releaseImage(result)
      }
    },
    [result],
  )

  useEffect(
    () => () => {
      generation.current++
    },
    [],
  )

  async function load(selected: FileInputFile) {
    const job = ++generation.current

    setBusy(true)
    setMessage('Reading the selected image…')

    let context: ImageManipulatorContext | undefined
    let image: ImageRef | undefined

    try {
      context = ImageManipulator.manipulate(selected.uri)
      image = await context.renderAsync()
      if (job !== generation.current) {
        return
      }

      setSource({
        uri: selected.uri,
        name: selected.name,
        width: image.width,
        height: image.height,
      })

      setCrop({ unit: '%', x: 10, y: 10, width: 80, height: 80 })
      setResult(null)
      setMessage('Image ready. The original stays unchanged when you crop.')
    } catch (error) {
      if (job === generation.current) {
        setMessage(
          error instanceof Error ? error.message : 'Could not open this image. Try another file.',
        )
      }
    } finally {
      image?.release()
      context?.release()
      if (job === generation.current) {
        setBusy(false)
      }
    }
  }

  async function makeCrop() {
    const job = ++generation.current

    setBusy(true)

    let context: ImageManipulatorContext | undefined
    let image: ImageRef | undefined

    try {
      const frame = containFrame({ width: cropWidth, height: cropHeight }, source)
      const natural = toNaturalCrop(crop, frame, source)

      context = ImageManipulator.manipulate(source.uri)

      const originX = Math.max(0, Math.floor(natural.x)),
        originY = Math.max(0, Math.floor(natural.y))

      context.crop({
        originX,
        originY,
        width: Math.min(source.width - originX, Math.ceil(natural.x + natural.width) - originX),
        height: Math.min(source.height - originY, Math.ceil(natural.y + natural.height) - originY),
      })

      image = await context.renderAsync()

      const output = await image.saveAsync({ format: SaveFormat.PNG })

      if (job !== generation.current) {
        releaseImage(output)
        return
      }

      setResult(output)
      setMessage('Cropped pixels are ready. Compare the preview, then export a copy or share it.')
    } catch (error) {
      if (job === generation.current) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Crop failed. Your source and note are still here.',
        )
      }
    } finally {
      image?.release()
      context?.release()
      if (job === generation.current) {
        setBusy(false)
      }
    }
  }

  <View className="sc-column">
    <View className="sc-intro sc-column">
      <Text className="sc-eyebrow">04 / FIELDWORK</Text>
      <Text className="sc-title">From a source to something worth sharing.</Text>
      <Text className="sc-lede">
        Import, frame, crop, and export actual pixels. Cancel a picker without losing your image or
        note.
      </Text>
    </View>
    <View className="sc-scenario sc-column">
      <Text className="sc-scenario-title">Try this: keep the original safe.</Text>
      <Text className="sc-muted">
        Move or resize the crop. Generate a preview, change your selection, and compare it with a
        new crop. Your note is saved locally as you type.
      </Text>
    </View>
    <View className="sc-field-grid">
      <View className="sc-panel sc-column">
        <FileInput
          id="field-import"
          label="Import an image"
          mode="dropzone"
          accept="image/png,image/jpeg,image/webp"
          value={file}
          isDisabled={busy}
          onChange={(value) => {
            const selected = Array.isArray(value) ? value[0] : value

            if (selected) {
              setFile(selected)
              void load(selected)
            }
          }}
        />
        <Button
          label="Take a photo"
          variant="secondary"
          isDisabled={busy}
          pressAction={async () => {
            try {
              const permission = await media.requestPermissions('camera')

              if (permission.status === 'denied') {
                setMessage(
                  'Camera access was denied. Import an image or use the bundled source instead.',
                )

                return
              }

              const picked = await media.capturePhoto()

              if (picked) {
                setFile(picked)
                await load(picked)
              } else {
                setMessage('No photo was added. Your previous image and note are unchanged.')
              }
            } catch {
              setMessage(
                'Camera capture is unavailable here. You can still import and crop an image.',
              )
            }
          }}
        />
        <Text className="sc-muted">
          {source.name + ' · ' + source.width + ' × ' + source.height}
        </Text>
        <View className="sc-crop-region" ref={measure.ref}>
          <ImageCrop
            id="field-crop"
            src={source.uri}
            alt="Source image with adjustable crop"
            imageWidth={source.width}
            imageHeight={source.height}
            width={cropWidth}
            height={cropHeight}
            crop={crop}
            minWidth={48}
            minHeight={48}
            ruleOfThirds
            disabled={busy}
            onChange={(_, percent) => setCrop(percent)}
          />
        </View>
        <HStack className="sc-actions">
          <Button label="Create cropped preview" isDisabled={busy} pressAction={makeCrop} />
          <Button
            label="Reset crop"
            variant="secondary"
            isDisabled={busy}
            onPress={() => setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 })}
          />
        </HStack>
      </View>
      <View className="sc-panel sc-column">
        <Text className="sc-heading">Field note</Text>
        <TextArea label="Note" value={note} onChange={setNote} rows={4} />
        @if (result) {
          <>
            <Image src={result.uri} alt="Cropped output" className="sc-field-preview" />
            <Text id="field-dimensions" className="sc-muted">
              {result.width + ' × ' + result.height + ' actual output pixels'}
            </Text>
            <HStack className="sc-actions">
              <Button
                label="Export image"
                pressAction={async () => {
                  const bytes = await files.readBytes({
                    name: 'field-note.png',
                    uri: result.uri,
                  })

                  const outcome = await files.export('field-note.png', bytes, {
                    mimeType: 'image/png',
                  })

                  setMessage(
                    outcome === 'saved'
                      ? 'Image exported. The original is unchanged.'
                      : outcome === 'cancelled'
                        ? 'Export cancelled. The cropped preview is still available.'
                        : 'A save dialog is unavailable here. Use Download copy instead.',
                  )
                }}
              />
              <Button
                label="Download copy"
                variant="secondary"
                pressAction={async () => {
                  const bytes = await files.readBytes({
                    name: 'field-note.png',
                    uri: result.uri,
                  })

                  const copy = await files.writeBytes('field-note.png', bytes)

                  files.release(copy)
                  setMessage('A copy was prepared using this platform’s file writer.')
                }}
              />
              <Button
                label="Share image"
                variant="secondary"
                pressAction={async () => {
                  const outcome = await share.file(result.uri, { mimeType: 'image/png' })

                  setMessage(
                    outcome === 'shared'
                      ? 'Share request completed.'
                      : outcome === 'cancelled'
                        ? 'Sharing cancelled. Your preview is unchanged.'
                        : 'File sharing is unavailable here. Export or download a copy instead.',
                  )
                }}
              />
            </HStack>
          </>
        } @else {
          <View className="sc-empty sc-column">
            <Text className="sc-heading">A new frame, a separate file.</Text>
            <Text className="sc-muted">
              Your cropped preview will appear here. Creating it never overwrites the
              original.
            </Text>
          </View>
        }
      </View>
    </View>
    <Text id="field-status" className="sc-status" accessibilityLiveRegion="polite">
      {message}
    </Text>
    <Text className="sc-footnote">
      Real import, crop and image encoding · local note storage · camera, export and sharing depend
      on the host
    </Text>
  </View>
}
