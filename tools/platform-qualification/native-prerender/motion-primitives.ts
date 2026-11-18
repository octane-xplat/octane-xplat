// The bounded motion facade used by this fixture, mirroring the producer's
// motion.View/Row/Pressable boundary; no substitute motion. Unsupported
// exports (MotionConfig, hooks, Presence, createMotion) stay out of scope.
import {
  MotionPressable,
  MotionRow,
  MotionView,
} from '../../../packages/motion/src/components.tsrx'

export const motion = { View: MotionView, Row: MotionRow, Pressable: MotionPressable }
