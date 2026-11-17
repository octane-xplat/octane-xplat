// Pixi 3D adapter. 'pixi.js' and '@pixi/3d' are dynamic imports: pixi's
// module-init isSafari() touches `navigator`, so on native it must not be
// reachable during eager bundle eval — installPixiEnv() seeds globals and
// installs the DOMAdapter first (env.mobile.ts), while env.ts on web just
// loads the module and keeps the BrowserAdapter.
import { installPixiEnv } from './env'
import { bufferViewBytes, parseGlb } from './glb'
import { decodeImageBytes } from './image'
import { readCoverage } from './pixel'
import type { EngineAdapter } from './types'
import type { Application as PixiApplication } from 'pixi.js'
import type { DirectionalLight, Model3D, View3D } from '@pixi/3d'

const CLEAR: readonly [number, number, number] = [10, 20, 31]

export function createPixiEngine(): EngineAdapter {
  let pixi: typeof import('pixi.js') | undefined
  let pixi3d: typeof import('@pixi/3d') | undefined
  let app: PixiApplication | undefined
  let view3d: View3D | undefined
  let model: Model3D | undefined
  let sun: DirectionalLight | undefined
  let glContext: WebGL2RenderingContext | undefined

  return {
    name: 'pixi3d',

    async init(canvas, gl, width, height) {
      glContext = gl
      pixi = await installPixiEnv()
      console.log('[engine-demo] pixi3d importing @pixi/3d')
      pixi3d = await import('@pixi/3d')
      // manageImports:false skips the renderer's lazy extension loaders, so
      // the WebGL backend pieces @pixi/3d registers there load eagerly here.
      await import('@pixi/3d/webgl')
      console.log('[engine-demo] pixi3d app.init start')
      app = new pixi.Application()
      await app.init({
        canvas: canvas as HTMLCanvasElement,
        context: gl,
        preference: 'webgl',
        width,
        height,
        resolution: 1,
        autoDensity: false,
        antialias: false,
        background: (CLEAR[0] << 16) | (CLEAR[1] << 8) | CLEAR[2],
        autoStart: false,
        sharedTicker: false,
        manageImports: false,
      })
      view3d = new pixi3d.View3D({ autoResize: true })
      app.stage.addChild(view3d)
      view3d.camera.position.set(0, 0.3, 2.4)

      sun = new pixi3d.DirectionalLight({ intensity: 3 })
      sun.position.set(-3, 5, 2)
      const ambient = new pixi3d.AmbientLight({ intensity: 0.8 })
      view3d.root.addChild(sun, ambient)
      sun.lookAt({ x: 0, y: 0.3, z: 0 })
    },

    async loadModel(bytes) {
      if (!view3d || !pixi || !pixi3d) {
        throw new Error('pixi3d: init() before loadModel()')
      }
      // Bypasses @pixi/3d's loadGlb fetch + loadImages Blob/objectURL path:
      // glbToGltf splits the container, each embedded image decodes through
      // the platform hook into a Texture, and parseGltf builds the scene.
      const { json, buffers } = pixi3d.glbToGltf(bytes)
      const glb = parseGlb(bytes)
      const images = json.images ?? []
      const textures: import('pixi.js').Texture[] = []
      for (const [index, image] of images.entries()) {
        if (image.bufferView === undefined) {
          throw new Error(`pixi3d: uri images unsupported (${image.uri ?? image.name})`)
        }
        const bitmap = await decodeImageBytes(
          bufferViewBytes(glb, image.bufferView),
          image.mimeType ?? 'image/png',
        )
        // decodeImageBytes returns the platform bitmap: a real ImageBitmap
        // on web, the plugin's ImageBitmap class on native — both satisfy
        // Pixi's ImageSource resource contract.
        textures[index] = pixi.Texture.from(bitmap as ImageBitmap)
      }
      const source = await pixi3d.parseGltf(json, buffers, textures)
      model = new pixi3d.Model3D({ source })
      view3d.root.addChild(model)
      sun?.lookAt(model.position)
    },

    rotate(rad) {
      if (model) {
        model.rotation.y += rad
      }
    },

    frame() {
      app?.render()
    },

    stats() {
      const pixel = glContext ? readCoverage(glContext, CLEAR) : 'no gl'
      return `renderer=${(app?.renderer as { name?: string } | undefined)?.name ?? '?'} ${pixel}`
    },

    dispose() {
      model = undefined
      app?.destroy({ removeView: false }, { children: true })
      app = undefined
      view3d = undefined
      sun = undefined
    },
  }
}
