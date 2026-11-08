import Paint from './Paint'
import { setLayoutProjectionScale } from '@octane-xplat/macos-appkit'
import {
  NSNotificationCenter,
  NSViewFrameDidChangeNotification,
} from '@octane-xplat/platform/macos'

export async function checkPaintLifecycle(root: any, nativeWindow: any) {
  const debug = root.__macosDebug
  const check = (condition: boolean, message: string) => {
    if (!condition) {
      throw Error('Box paint: ' + message)
    }
  }

  const near = (value: unknown, expected: number) => Math.abs(Number(value) - expected) < 0.1
  const settle = () =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        nativeWindow.contentView.layoutSubtreeIfNeeded()
        setTimeout(resolve, 30)
      }, 30),
    )

  const layers = (view: any) => Number(view.layer.sublayers?.count ?? 0)
  const frame = (view: any) =>
    NSNotificationCenter.defaultCenter.postNotificationNameObject(
      NSViewFrameDidChangeNotification,
      view,
    )

  root.render(Paint, {})
  await settle()

  const percent = debug.findId('paint-percent'),
    bands = debug.findId('paint-bands'),
    shadows = debug.findId('paint-shadows'),
    backgrounds = debug.findId('paint-backgrounds')

  check(near(percent.layer.cornerRadius, 40), 'percent radius initial')
  check(
    near(percent.layer.transform.m41, 30),
    'percent translation initial: width=' +
      percent.frame.size.width +
      ', m41=' +
      percent.layer.transform.m41 +
      ', m42=' +
      percent.layer.transform.m42,
  )

  check(layers(percent) === 1, 'one outline host')

  const point = debug.findId('paint-point')

  check(near(point.layer.transform.m41, 10), 'point transform survives initial native layout')

  const outline = percent.layer.sublayers.objectAtIndex(0)

  check(
    near(outline.frame.origin.x, -3) && near(outline.frame.size.width, 126),
    'outline expanded bounds',
  )

  check(layers(bands) === 1 && bands.layer.mask != null, 'banded border and per-corner mask')
  check(layers(shadows) === 1, 'one inset shadow host')

  const siblings = shadows.layer.superlayer.sublayers
  const outsetCount = () => {
    let count = 0

    for (let i = 0; i < Number(siblings.count); i++) {
      if (Number(siblings.objectAtIndex(i).shadowOpacity) > 0) {
        count++
      }
    }

    return count
  }

  check(outsetCount() === 2, 'two outset shadow hosts')
  check(layers(backgrounds) === 1, 'one background host')

  const bg = backgrounds.layer.sublayers.objectAtIndex(0)

  check(Number(bg.sublayers.count) === 2, 'two background entries')
  check(
    bg.sublayers.objectAtIndex(0).contents != null,
    'URL image completion populated native contents',
  )

  setLayoutProjectionScale(shadows, { x: 2, y: 2 })
  check(near(shadows.layer.cornerRadius, 10), 'projection radius compensation')
  setLayoutProjectionScale(shadows, null)
  check(near(shadows.layer.cornerRadius, 20), 'projection radius restoration')
  for (let i = 0; i < 3; i++) {
    debug.pressId('advance-paint')
    await settle()
    frame(percent)
    frame(bands)
    frame(shadows)
    frame(backgrounds)
    check(debug.findId('paint-percent') === percent, 'retained identity')
    check(near(point.layer.transform.m41, 10), 'point transform survives resize')
    check(
      near(percent.layer.cornerRadius, 50) && near(percent.layer.transform.m41, 50),
      'percent geometry after resize',
    )

    check(
      layers(percent) === 1 &&
        layers(bands) === 1 &&
        layers(backgrounds) === 1 &&
        layers(shadows) === 1,
      'repeated updates stack no layers',
    )

    check(
      near(percent.layer.sublayers.objectAtIndex(0).frame.size.width, 206),
      'outline follows resized bounds',
    )

    check(outsetCount() === 2, 'repeated updates stack no shadow siblings')
  }

  debug.pressId('advance-paint')
  await settle()
  check(
    [percent, bands, shadows, backgrounds].every((view) => layers(view) === 0),
    'style removal detaches all paint hosts',
  )

  check(
    near(percent.layer.cornerRadius, 0) && near(percent.layer.transform.m41, 0),
    'style removal restores radius and transform',
  )

  check(outsetCount() === 0, 'style removal releases sibling shadows')
  root.unmount()
  root.unmount()
  for (const view of [percent, bands, shadows, backgrounds]) {
    frame(view)
    check(layers(view) === 0, 'retired native notification cannot repaint')
  }

  check(
    !percent.superview && !bands.superview && !shadows.superview && !backgrounds.superview,
    'retirement detaches views',
  )

  console.log('PACKED_BOX_PAINT_OK')
}
