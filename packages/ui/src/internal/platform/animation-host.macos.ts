const transformPaths: Record<string, string> = {
  translateX: 'transform.translation.x',
  translateY: 'transform.translation.y',
  scale: 'transform.scale',
  scaleX: 'transform.scale.x',
  scaleY: 'transform.scale.y',
  rotate: 'transform.rotation.z',
}

export function readReducedMotion(): boolean {
  const workspace = (globalThis as Record<string, any>).NSWorkspace?.sharedWorkspace
  const value = workspace?.accessibilityDisplayShouldReduceMotion

  return Boolean(typeof value === 'function' ? value.call(workspace) : value)
}

/** Keep AppKit animations in the renderer's y-down coordinate system. */
export function writeAnimatedProperty(host: any, property: string, value: number): void {
  const path = transformPaths[property]
  if (host.nativeViewProtected && (path || property === 'opacity')) {
    // Core owns the transform state used when AppKit repaints after layout.
    if (property === 'scale') {
      host.scaleX = value
      host.scaleY = value
    } else {
      host[property] = value
    }
    return
  }

  if (property === 'opacity') {
    host.alphaValue = value
    return
  }

  if (path) {
    host.wantsLayer = true

    // Explicit per-frame samples must not acquire implicit CA interpolation.
    const transaction = (globalThis as Record<string, any>).CATransaction

    transaction.begin()
    try {
      transaction.setDisableActions(true)
      host.layer.setValueForKeyPath(
        property === 'rotate'
          ? (value * Math.PI) / 180
          : property === 'translateY'
            ? -value
            : value,
        path,
      )
    } finally {
      transaction.commit()
    }

    return
  }

  throw new Error('useAnimation: unsupported AppKit property ' + property)
}
