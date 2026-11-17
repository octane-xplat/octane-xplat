/** @jsxImportSource @octane-xplat/jsx */
import { Canvas } from '@octane-xplat/canvas'
import { Button, Heading, HStack, Pressable, Text, View } from '@octane-xplat/ui'
import { useState } from 'octane'
import { attachCanvas, rotateEngines, setEngineReporter } from './engine/boot'

/** Two `<Canvas>` elements side by side, each with its own WebGL2 context:
 *  PlayCanvas on the left, Pixi 3D on the right, both rendering the same
 *  DamagedHelmet.glb. Pressing anywhere rotates both models one fixed step
 *  and renders one frame — engine work lives in engine/boot.ts because the
 *  universal compiler rejects async functions inside .tsrx. */
export function EngineDemo() @{
  const [pcStatus, setPcStatus] = useState('waiting for canvas')
  const [pixiStatus, setPixiStatus] = useState('waiting for canvas')
  const [taps, setTaps] = useState(0)

  setEngineReporter((slot, status) => {
    if (slot === 'playcanvas') {
      setPcStatus(status)
    } else {
      setPixiStatus(status)
    }
  })

  const step = () => setTaps(rotateEngines())

  <View className="gap-3">
    <Heading level={2}>3D engines</Heading>
    <Text>
      Same glb, two engines, two WebGL2 canvases — PlayCanvas (left) and Pixi 3D (right).
      Press to rotate both.
    </Text>
    <Pressable id="engine-rotate-area" testID="engine-rotate-area" onPress={step}>
      <HStack className="gap-2">
        <View className="gap-1">
          <Text className="text-sm font-semibold">PlayCanvas</Text>
          <Canvas
            id="engine-canvas-pc"
            width={180}
            height={280}
            style={{ width: 180, height: 280 }}
            onReady={(ready) => attachCanvas('playcanvas', ready)}
          />
        </View>
        <View className="gap-1">
          <Text className="text-sm font-semibold">Pixi 3D</Text>
          <Canvas
            id="engine-canvas-pixi"
            width={180}
            height={280}
            style={{ width: 180, height: 280 }}
            onReady={(ready) => attachCanvas('pixi3d', ready)}
          />
        </View>
      </HStack>
    </Pressable>
    <View className="gap-1">
      <Text id="engine-status-pc">{`playcanvas: ${pcStatus}`}</Text>
      <Text id="engine-status-pixi">{`pixi3d: ${pixiStatus}`}</Text>
      <Text id="engine-taps">{`taps: ${taps}`}</Text>
    </View>
    <Button
      id="engine-rotate"
      testID="engine-rotate"
      className="btn bg-primary"
      accessibilityLabel="Rotate models"
      onPress={step}
    >
      <Text className="text-onprimary">Rotate models</Text>
    </Button>
  </View>
}
