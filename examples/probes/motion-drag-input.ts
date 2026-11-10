import { createGestureDispatch } from '../../tools/probe/gesture-dispatch.mobile'

const input = createGestureDispatch()

/** Native adapter dispatch; this does not synthesize OS contacts. */
export const dragInput = input.send
