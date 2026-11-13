import '@nativescript/core/globals'

const windows = UIApplication.sharedApplication.windows
let label
for (let i = 0; i < windows.count; i++) {
  const candidate = windows.objectAtIndex(i).viewWithTag(6021)
  if (candidate) {
    if (label) throw new Error('More than one native startup label')
    label = candidate
  }
}
if (!label || label.text !== 'Native before JavaScript')
  throw new Error('Normal SDK entry did not find the original native label')
label.text = 'JavaScript updated the native label'
