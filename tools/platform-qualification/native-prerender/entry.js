// A native-owned application is already running. Do not call Application.run().
const scene = UIApplication.sharedApplication.connectedScenes.allObjects.objectAtIndex(0)
const root = scene.windows.objectAtIndex(0).rootViewController.view
function findLabel(view) {
  if (view instanceof UILabel) return view
  const children = view.subviews
  for (let index = 0; index < children.count; index++) {
    const found = findLabel(children.objectAtIndex(index))
    if (found) return found
  }
  return null
}
const label = findLabel(root)
if (!label) throw new Error('Native label unavailable through bridge')
label.text = 'Updated through NativeScript bridge'
