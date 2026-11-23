/** Replace the cell while preserving the field, active editor, and selection. */
export function swapTextFieldCell(
  field: any,
  createCell: (text: string) => any,
  didSwap?: () => void,
): void {
  const editor = field.currentEditor()
  const selection = editor?.selectedRange
  const window = field.window
  const focused = editor != null && window != null
  const value = String(editor?.string ?? field.stringValue ?? '')
  const previous = field.cell

  if (focused) {
    window.makeFirstResponder(null)
  }

  const cell = createCell(value)

  for (const name of [
    'font',
    'textColor',
    'alignment',
    'editable',
    'selectable',
    'enabled',
    'bezeled',
    'bordered',
    'drawsBackground',
    'backgroundColor',
    'sendsActionOnEndEditing',
    'target',
    'action',
    'tag',
  ]) {
    cell[name] = previous[name]
  }

  field.cell = cell
  field.stringValue = value
  didSwap?.()
  if (focused) {
    window.makeFirstResponder(field)
    if (selection) {
      const editor = field.currentEditor()

      if (editor) {
        editor.selectedRange = selection
      }
    }
  }
}
