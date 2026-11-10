import type { GestureComposition, GestureInput, PanGesture, PinchGesture } from './types'

/** Leaf handles in attachment order. Duplicate leaves and cyclic descriptions are errors. */
export function gestureLeaves(input: GestureInput): readonly (PanGesture | PinchGesture)[] {
  const leaves: (PanGesture | PinchGesture)[] = []
  const seen = new Set<GestureInput>()
  function visit(node: GestureInput) {
    if (seen.has(node)) {
      throw new Error('A gesture handle or composition may occur only once in an attachment tree')
    }

    seen.add(node)
    if (node.kind === 'pan' || node.kind === 'pinch') {
      leaves.push(node)
    } else {
      if (node.gestures.length < 2) {
        throw new Error('Gesture composition requires at least two children')
      }

      for (const child of node.gestures) {
        visit(child)
      }
    }
  }

  visit(input)
  return leaves
}

function composition(
  kind: GestureComposition['kind'],
  gestures: readonly GestureInput[],
): GestureComposition {
  const result: GestureComposition = Object.freeze({ kind, gestures: Object.freeze([...gestures]) })

  gestureLeaves(result)
  return result
}

/** First child to activate wins; argument order resolves exact activation ties. */
export function compete(
  first: GestureInput,
  second: GestureInput,
  ...rest: GestureInput[]
): GestureComposition {
  return composition('compete', [first, second, ...rest])
}

/** Allows each child to activate without cancelling its siblings. */
export function simultaneous(
  first: GestureInput,
  second: GestureInput,
  ...rest: GestureInput[]
): GestureComposition {
  return composition('simultaneous', [first, second, ...rest])
}

/** Later children wait until earlier eligible children fail recognition. */
export function prioritize(
  first: GestureInput,
  second: GestureInput,
  ...rest: GestureInput[]
): GestureComposition {
  return composition('prioritize', [first, second, ...rest])
}

/** Structural equality ignores freshly allocated descriptions, never leaf identity. */
export function sameGestureInput(a: GestureInput, b: GestureInput): boolean {
  if (a === b) {
    return true
  }

  if (a.kind === 'pan' || a.kind === 'pinch' || b.kind === 'pan' || b.kind === 'pinch') {
    return false
  }

  return (
    a.kind === b.kind &&
    a.gestures.length === b.gestures.length &&
    a.gestures.every((child, index) => sameGestureInput(child, b.gestures[index]))
  )
}

/** Lowest-common-ancestor relation; order is meaningful only under prioritize. */
export function gestureRelation(
  input: GestureInput,
  a: PanGesture | PinchGesture,
  b: PanGesture | PinchGesture,
): {
  kind: GestureComposition['kind']
  before: boolean
} | null {
  if (input.kind === 'pan' || input.kind === 'pinch') {
    return null
  }

  const branchA = input.gestures.findIndex((child) => gestureLeaves(child).includes(a))
  const branchB = input.gestures.findIndex((child) => gestureLeaves(child).includes(b))

  if (branchA < 0 || branchB < 0) {
    return null
  }

  if (branchA === branchB) {
    return gestureRelation(input.gestures[branchA], a, b)
  }

  return { kind: input.kind, before: branchA < branchB }
}
