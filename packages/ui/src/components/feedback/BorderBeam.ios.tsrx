/** @jsxImportSource @octane-xplat/jsx */
import { View } from '@nativescript/core'
import {
  CABasicAnimation,
  CAMediaTimingFunction,
  CAShapeLayer,
  CATransaction,
  CGPathCreateWithRoundedRect,
  NSArray,
  NSNumber,
  UIColor,
} from '@octane-xplat/platform/ios'

import type { BorderBeamProps } from '../../props'
import { useBorderBeamFrame, type BorderBeamPainter } from './useBorderBeamFrame.tsrx'
import { beamChannels, beamDuration, beamInset, beamStrokes, beamTrack } from './border-beam'

function createPainter(): BorderBeamPainter {
  let layers: CAShapeLayer[] = []
  let last = ''

  function clear() {
    for (const layer of layers) {
      layer.removeAllAnimations()
      layer.removeFromSuperlayer()
    }

    layers = []
    last = ''
  }

  return {
    update(host, radius, reducedMotion) {
      const view = host instanceof View ? host.ios : undefined
      const parent = view?.layer
      const bounds = view?.bounds

      if (!view?.window || !parent || !bounds) {
        clear()
        return
      }

      const track = beamTrack(bounds.size.width, bounds.size.height, radius)

      if (!track) {
        clear()
        return
      }

      const next = `${track.width}:${track.height}:${track.radius}:${reducedMotion}`

      if (last === next) {
        return
      }

      const rect = {
        origin: { x: beamInset, y: beamInset },
        size: { width: track.width, height: track.height },
      }

      const path = CGPathCreateWithRoundedRect(rect, track.radius, track.radius, null)

      CATransaction.begin()
      CATransaction.setDisableActions(true)
      try {
        clear()
        for (const stroke of beamStrokes) {
          const layer = CAShapeLayer.new()
          const [red, green, blue] = beamChannels(stroke.color)
          const head = track.perimeter * stroke.length

          layer.name = 'vx-border-beam'
          layer.frame = bounds
          layer.path = path
          layer.fillColor = UIColor.clearColor.CGColor
          layer.strokeColor = UIColor.colorWithRedGreenBlueAlpha(
            red,
            green,
            blue,
            stroke.opacity,
          ).CGColor

          layer.lineCap = 'round'
          layer.lineWidth = stroke.width
          layer.lineDashPattern = NSArray.arrayWithArray([
            NSNumber.numberWithDouble(head),
            NSNumber.numberWithDouble(track.perimeter - head),
          ])

          layer.lineDashPhase = head
          layers.push(layer)
          parent.addSublayer(layer)

          if (!reducedMotion) {
            const animation = CABasicAnimation.animationWithKeyPath('lineDashPhase')

            animation.fromValue = NSNumber.numberWithDouble(head)
            animation.toValue = NSNumber.numberWithDouble(head - track.perimeter)
            animation.duration = beamDuration / 1000
            animation.repeatCount = Infinity
            animation.timingFunction = CAMediaTimingFunction.functionWithName('linear')
            layer.addAnimationForKey(animation, 'vx-border-beam')
          }
        }

        last = next
      } finally {
        CATransaction.commit()
      }
    },
    clear,
  }
}

export type { BorderBeamProps } from '../../props'

export function BorderBeam(props: BorderBeamProps): unknown @{
  const frame = useBorderBeamFrame(props, createPainter)

  <masonview {...frame}>{props.children}</masonview>
}
