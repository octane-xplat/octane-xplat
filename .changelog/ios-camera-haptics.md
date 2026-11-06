### Choose iOS feedback during camera recording

Camera sessions can explicitly allow haptics and system sounds while the microphone is active, including during preview. The option preserves the audio category and route and restores the previous policy after the last opted-in camera owner releases microphone capture. Other platforms keep their existing behavior.

```ts
import { createCameraSession } from '@octane-xplat/camera'

const camera = createCameraSession({
  audio: true,
  ios: { allowHapticsAndSystemSoundsDuringRecording: true },
})
```

See the [camera recording guide](https://octane-xplat.goddardai.org/movie-capture#allow-ios-feedback-while-the-microphone-is-active). Physical tactile output during capture still requires verification on supported iPhones.
