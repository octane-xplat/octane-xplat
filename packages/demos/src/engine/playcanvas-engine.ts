// PlayCanvas adapter. Model loading is bytes-first on every platform:
// GlbParser.parse() runs the real container pipeline on an ArrayBuffer —
// buffers/bufferViews come from the BIN chunk, and embedded images reach us
// through options.image.processAsync, which replaces the engine's
// fetch/Blob/createImageBitmap image loading with the platform decodeImage
// hook (Blob+createImageBitmap on web, @nativescript/canvas ImageBitmap on
// native). GlbParser/GlbContainerResource are not re-exported from the
// 'playcanvas' index in 2.24.1, so they come through the published
// './build/*' deep paths.
import * as pc from 'playcanvas'
import { GlbParser } from 'playcanvas/build/playcanvas/src/framework/parsers/glb-parser.js'
import { GlbContainerResource } from 'playcanvas/build/playcanvas/src/framework/parsers/glb-container-resource.js'
import { bufferViewBytes, parseGlb } from './glb'
import { decodeImageBytes } from './image'
import { readCoverage } from './pixel'
import type { EngineAdapter } from './types'

const CLEAR: readonly [number, number, number] = [10, 20, 31]

/** Image indices whose bytes feed baseColor/emissive — decoded into sRGB
 *  textures; everything else stays linear RGBA8. Mirrors GlbParser's own
 *  gammaTextures set, which the processAsync path bypasses. */
function srgbImageIndices(json: ReturnType<typeof parseGlb>['json']): Set<number> {
  const set = new Set<number>()
  for (const material of json.materials ?? []) {
    for (const textureIndex of [
      material.pbrMetallicRoughness?.baseColorTexture?.index,
      material.emissiveTexture?.index,
    ]) {
      const source = textureIndex === undefined ? undefined : json.textures?.[textureIndex]?.source
      if (source !== undefined) {
        set.add(source)
      }
    }
  }
  return set
}

export function createPlayCanvasEngine(): EngineAdapter {
  let app: pc.AppBase | undefined
  let device: pc.WebglGraphicsDevice | undefined
  let model: pc.Entity | undefined
  let glContext: WebGL2RenderingContext | undefined
  let rotation = 0

  return {
    name: 'playcanvas',

    init(canvas, gl, width, height) {
      glContext = gl
      device = new pc.WebglGraphicsDevice(canvas as HTMLCanvasElement, {
        gl,
        antialias: false,
        alpha: false,
        preserveDrawingBuffer: true,
      })
      const options = new pc.AppOptions()
      options.graphicsDevice = device
      options.componentSystems = [
        pc.RenderComponentSystem,
        pc.CameraComponentSystem,
        pc.LightComponentSystem,
      ]
      options.devtools = false
      app = new pc.AppBase(canvas as HTMLCanvasElement)
      app.init(options)
      app.scene.clusteredLightingEnabled = false
      app.scene.ambientLight = new pc.Color(0.6, 0.6, 0.6)
      device.setResolution(width, height)

      const camera = new pc.Entity('camera')
      camera.addComponent('camera', {
        clearColor: new pc.Color(CLEAR[0] / 255, CLEAR[1] / 255, CLEAR[2] / 255, 1),
      })
      camera.setPosition(0, 0.4, 2.4)
      camera.lookAt(0, 0.3, 0)
      app.root.addChild(camera)

      const sun = new pc.Entity('sun')
      sun.addComponent('light', { type: 'directional', intensity: 1.4, castShadows: false })
      sun.setEulerAngles(45, 30, 0)
      app.root.addChild(sun)
    },

    loadModel(bytes) {
      return new Promise<void>((resolve, reject) => {
        if (!app || !device) {
          reject(new Error('playcanvas: init() before loadModel()'))
          return
        }
        const glb = parseGlb(bytes)
        const srgb = srgbImageIndices(glb.json)
        const images = glb.json.images ?? []
        const options = {
          image: {
            // Supplied instead of the engine's registry.load() path — that
            // path wants Blob/createObjectURL (or an <img>), which native
            // lacks without a DOM polyfill.
            processAsync: (
              gltfImage: { bufferView?: number; mimeType?: string; uri?: string; name?: string },
              callback: (err: unknown, asset?: pc.Asset) => void,
            ) => {
              // GlbParser hands back its own image record objects, so
              // match the source json entry by bufferView+mimeType rather
              // than identity for the sRGB set.
              const index = images.findIndex(
                (image) => image.bufferView === gltfImage.bufferView && image.mimeType === gltfImage.mimeType,
              )
              if (gltfImage.bufferView === undefined) {
                callback(new Error(`playcanvas: uri images unsupported (${gltfImage.uri ?? gltfImage.name})`))
                return
              }
              console.log(`[engine-demo] playcanvas decode image ${index} (${gltfImage.mimeType})`)
              decodeImageBytes(bufferViewBytes(glb, gltfImage.bufferView), gltfImage.mimeType ?? 'image/png').then(
                (bitmap) => {
                  console.log(`[engine-demo] playcanvas image ${index} decoded ${bitmap.width}x${bitmap.height}`)
                  const texture = new pc.Texture(device!, {
                    width: bitmap.width,
                    height: bitmap.height,
                    format: srgb.has(index) ? pc.PIXELFORMAT_SRGBA8 : pc.PIXELFORMAT_RGBA8,
                    mipmaps: true,
                  })
                  texture.setSource(bitmap as HTMLImageElement)
                  const asset = new pc.Asset(gltfImage.name ?? `glb-image-${index}`, 'texture', { url: '' })
                  asset.resource = texture
                  asset.loaded = true
                  callback(null, asset)
                },
                (err) => callback(err),
              )
            },
          },
        }
        console.log('[engine-demo] playcanvas GlbParser.parse start')
        GlbParser.parse('DamagedHelmet.glb', '', bytes, device, app.assets, options, [], (err: unknown, result: never) => {
          console.log(`[engine-demo] playcanvas parse callback err=${String(err)}`)
          if (err) {
            reject(err)
            return
          }
          try {
            const container = new GlbContainerResource(
              result,
              new pc.Asset('DamagedHelmet.glb', 'container', { url: '' }),
              app!.assets,
              GlbParser.createDefaultMaterial(),
            )
            const entity: pc.Entity = container.instantiateRenderEntity({})
            model = entity
            app!.root.addChild(entity)
            resolve()
          } catch (error) {
            reject(error)
          }
        })
      })
    },

    rotate(rad) {
      rotation += rad * (180 / Math.PI)
      model?.setEulerAngles(0, rotation, 0)
    },

    frame(dt) {
      app?.update(dt)
      app?.render()
    },

    stats() {
      const draws = (device as unknown as { _drawCallsPerFrame?: number })?._drawCallsPerFrame ?? -1
      const pixel = glContext ? readCoverage(glContext, CLEAR) : 'no gl'
      return `draws=${draws} ${pixel}`
    },

    dispose() {
      model = undefined
      app?.destroy()
      app = undefined
      device = undefined
    },
  }
}
