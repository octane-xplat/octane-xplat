import { Application, View } from '@nativescript/core'
import { createAppleBackend, type NativeView } from './backend.apple'
import type { CaptureBackend } from './backend-types'

export const backend: CaptureBackend = createAppleBackend({
  resolve(target) {
    const value = target instanceof View ? target.nativeViewProtected : target

    if (!(value instanceof UIView)) {
      throw new TypeError('Capture requires a mounted NativeScript View or UIView')
    }

    return value
  },
  screen() {
    const window = Application.primaryWindow?.ios?.uiWindow

    if (!window) {
      throw new Error('A primary iOS app window is required')
    }

    return window
  },
  renderInContext: true,
  available: () => typeof UIGraphicsImageRenderer !== 'undefined',
  // UIWindow.window is nil for the window itself; attachment there means a
  // scene association. The Swift engine's detached check never runtime-ran on
  // a window target, so captureScreen was refused until this hook.
  attached: (view) => (view instanceof UIWindow ? view.windowScene !== null : view.window !== null),
  protectedView: ['WKWebView', 'UIWebView', 'MTKView', 'GLKView'],
  protectedLayer: ['AVPlayerLayer', 'CAMetalLayer', 'CAEAGLLayer'],
  scale: (view) =>
    (view instanceof UIWindow ? view.screen : (view.window as UIWindow | null)?.screen)?.scale ?? 1,
  checkSourceDimensions: false,
  render(value, width, height, options) {
    const view = value as unknown as UIView
    const settings = UIGraphicsImageRendererFormat.defaultFormat()

    settings.scale = 1
    settings.opaque = options.format === 'jpg'

    const renderer = UIGraphicsImageRenderer.alloc().initWithSizeFormat(
      CGSizeMake(width, height),
      settings,
    )

    let rendered = true
    const image = renderer.imageWithActions((context) => {
      if (options.format === 'jpg') {
        UIColor.whiteColor.setFill()
        context.fillRect(CGRectMake(0, 0, width, height))
      }

      CGContextScaleCTM(
        context.CGContext,
        width / view.bounds.size.width,
        height / view.bounds.size.height,
      )

      CGContextTranslateCTM(context.CGContext, -view.bounds.origin.x, -view.bounds.origin.y)
      if (options.useRenderInContext) {
        view.layer.renderInContext(context.CGContext)
      } else {
        rendered = view.drawViewHierarchyInRectAfterScreenUpdates(view.bounds, true)
      }
    })

    if (!rendered) {
      throw new Error('UIKit did not render the complete view hierarchy')
    }

    const data =
      options.format === 'png'
        ? UIImagePNGRepresentation(image)
        : UIImageJPEGRepresentation(image, options.quality)

    if (!data) {
      throw new Error('UIKit could not encode the capture')
    }

    return data
  },
})
