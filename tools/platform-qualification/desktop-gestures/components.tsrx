/** @jsxImportSource @octane-xplat/jsx */
import {
  usePanGesture$,
  View,
  Pressable,
  Text,
  TextInput,
  ScrollableArea,
  Slider,
} from '@octane-xplat/ui'

import { motion, MotionConfig } from '@octane-xplat/motion'
import { useLayoutEffect } from 'octane'

export { scene } from './scene'

import {
  bindParent,
  bindMotion,
  bindButton,
  bindPanel,
  bindSlider,
  bindScroll,
  bindField,
} from './scene'

export function Components(props: {
  report(kind: string, detail?: unknown): void
  retire?(): void
}) {
  useLayoutEffect(() => props.report('scene-layout-effect'), [])

  const pan = usePanGesture$({
    axis: 'x',
    onStart: () => props.report('reveal-start'),
    onUpdate: (sample) => props.report('reveal-move', sample.translation),
    onFinalize: (terminal) => props.report('reveal-finish', terminal.outcome),
  })

  return (
    <MotionConfig reducedMotion="never">
      <View style={{ width: 480, height: 540, flexDirection: 'column' }}>
        <View
          ref={bindParent}
          style={{
            width: 440,
            height: 160,
            marginLeft: 80,
            marginTop: 40,
            transform: 'scale(1.25)',
          }}
        >
          <motion.View
            id="qualification-motion"
            ref={bindMotion}
            drag="x"
            dragMomentum={false}
            dragConstraints={{ left: 0, right: 160 }}
            onDragStart={(_event, info) => props.report('drag-start', info.offset)}
            onDrag={(_event, info) => props.report('drag-move', info.offset)}
            onDragEnd={(_event, info) => props.report('drag-finish', info)}
            style={{ width: 280, height: 100 }}
          >
            <Pressable
              id="qualification-button"
              ref={bindButton}
              accessibilityRole="button"
              accessibilityLabel="Keep draft"
              onPress={(event) => props.report('press', event.source)}
              style={{ width: 180, height: 80 }}
            >
              <Text>Keep draft</Text>
            </Pressable>
          </motion.View>
        </View>
        <View
          id="qualification-reveal"
          ref={bindPanel}
          gestures={pan}
          style={{ width: 440, height: 280 }}
        >
          <ScrollableArea
            ref={bindScroll}
            axis="block"
            width={400}
            height={260}
            label="Draft history"
          >
            <View style={{ width: 360, height: 800, flexDirection: 'column' }}>
              <TextInput
                ref={bindField}
                label="Draft title"
                defaultValue="Unsaved"
                onChange={(text) => props.report('edit', text)}
              />
              <View ref={bindSlider} style={{ width: 300, height: 80 }}>
                <Slider
                  label="Draft position"
                  defaultValue={50}
                  onValueChange={(value) => props.report('slider-change', value)}
                />
              </View>
              <View style={{ height: 680 }}>
                <Text>Scroll the draft history</Text>
              </View>
            </View>
          </ScrollableArea>
        </View>
        {props.retire && (
          <Pressable
            accessibilityLabel="Retire scene"
            onPress={props.retire}
            style={{ width: 180, height: 44 }}
          >
            <Text>Retire scene</Text>
          </Pressable>
        )}
      </View>
    </MotionConfig>
  )
}
