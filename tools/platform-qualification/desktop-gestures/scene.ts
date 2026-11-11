import type { ScrollableAreaHandle, TextInputHandle } from '@octane-xplat/ui'

export interface Scene<Host extends object = object> {
  motion: Host | null
  parent: Host | null
  button: Host | null
  panel: Host | null
  slider: Host | null
  scroll: ScrollableAreaHandle | null
  field: TextInputHandle | null
}

export interface MountedScene<Host extends object> {
  motion: Host
  parent: Host
  button: Host
  panel: Host
  slider: Host
  scroll: ScrollableAreaHandle
  field: TextInputHandle
}

// Shared components expose renderer-neutral host objects. Each platform driver
// validates its concrete host before observing native geometry or input state.
export const scene: Scene = {
  motion: null,
  parent: null,
  button: null,
  panel: null,
  slider: null,
  scroll: null,
  field: null,
}

export const bindParent = (host: object | null) => {
  scene.parent = host
}

export const bindMotion = (host: object | null) => {
  scene.motion = host
}

export const bindButton = (host: object | null) => {
  scene.button = host
}

export const bindPanel = (host: object | null) => {
  scene.panel = host
}

export const bindSlider = (host: object | null) => {
  scene.slider = host
}

export const bindScroll = (host: ScrollableAreaHandle | null) => {
  scene.scroll = host
}

export const bindField = (host: TextInputHandle | null) => {
  scene.field = host
}

export function readScene<Host extends object>(
  isHost: (host: object) => host is Host,
): MountedScene<Host> {
  const { motion, parent, button, panel, slider, scroll, field } = scene

  if (
    !motion ||
    !parent ||
    !button ||
    !panel ||
    !slider ||
    !scroll ||
    !field ||
    !isHost(motion) ||
    !isHost(parent) ||
    !isHost(button) ||
    !isHost(panel) ||
    !isHost(slider)
  ) {
    throw new Error('Public scene has not mounted the expected native hosts')
  }

  return { motion, parent, button, panel, slider, scroll, field }
}
