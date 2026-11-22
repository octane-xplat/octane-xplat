import {
  type NSView,
  NSVisualEffectBlendingMode,
  NSVisualEffectMaterial,
  NSVisualEffectView,
} from '@octane-xplat/platform/macos'

/** Pin the AppKit glass material behind the host's independently drawn children. */
export function mountGlassBackdrop(view: NSView): NSVisualEffectView {
  const backdrop = NSVisualEffectView.alloc().initWithFrame(view.bounds)

  backdrop.material = NSVisualEffectMaterial.UnderWindowBackground
  backdrop.blendingMode = NSVisualEffectBlendingMode.Behind
  backdrop.translatesAutoresizingMaskIntoConstraints = false
  view.addSubview(backdrop)
  backdrop.leadingAnchor.constraintEqualToAnchor(view.leadingAnchor).active = true
  backdrop.trailingAnchor.constraintEqualToAnchor(view.trailingAnchor).active = true
  backdrop.topAnchor.constraintEqualToAnchor(view.topAnchor).active = true
  backdrop.bottomAnchor.constraintEqualToAnchor(view.bottomAnchor).active = true
  return backdrop
}
