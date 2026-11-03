import { Microsoft } from '@octane-xplat/platform/windows'

/** Core names the outer Border. Expose the actual WinUI Image peer instead. */
export function bindImageAccessibility(
  view: any,
  label: string | undefined,
): (() => void) | undefined {
  if (!view || label == null) {
    return
  }

  const automation = Microsoft.UI.Xaml.Automation.AutomationProperties
  let restore: (() => void) | undefined
  let active = true
  const apply = () => {
    if (!active || !view.windows || !view.nativeViewProtected) {
      return
    }

    restore?.()
    const image = view.windows
    const border = view.nativeViewProtected
    const previousName = automation.GetName(image)
    const previousView = automation.GetAccessibilityView(border)
    automation.SetName(image, label)
    automation.SetAccessibilityView(
      border,
      Microsoft.UI.Xaml.Automation.Peers.AccessibilityView.Raw,
    )
    restore = () => {
      automation.SetName(image, previousName)
      automation.SetAccessibilityView(border, previousView)
    }
  }
  view.on('loaded', apply)
  if (view.isLoaded) {
    apply()
  }

  return () => {
    active = false
    view.off('loaded', apply)
    restore?.()
    restore = undefined
  }
}
