// This gate exercises the native transport and shared owner. It is deliberately
// separate from a public-component or packed NativeScript application gate.
import { createPanController } from '../../../packages/ui/src/gestures/controller.ts'
import {
  attachWindowsGesture,
  attachWindowsPress,
  dispatchWindowsActivation,
  createWindowsActionControl,
  windowsActivationSource,
  observeWindowsActionControl,
} from '../../../packages/ui/src/gestures/input.windows.ts'
const { Microsoft, NSWinRT } = globalThis
const log = (value) =>
  NSWinRT.dotnet.invoke('', 'GestureBindings.GateLog', 'Write', [JSON.stringify(value)])
const managedDelegate = NSWinRT.dotnet.asDelegate
NSWinRT.dotnet.asDelegate = (type, callback) =>
  managedDelegate(type, (json) => {
    if (json.startsWith('{')) log({ transport: JSON.parse(json) })
    return callback(json)
  })
try {
  const win = new Microsoft.UI.Xaml.Window()
  win.Title = 'octane-shared-gesture-gate'
  const root = new Microsoft.UI.Xaml.Controls.Grid()
  const panel = new Microsoft.UI.Xaml.Controls.Grid()
  const button = createWindowsActionControl('Button')
  button.Content = 'Handled native button'
  button.Width = 240
  button.Height = 120
  panel.Children.Append(button)
  root.Children.Append(panel)
  const cleanupButton = new Microsoft.UI.Xaml.Controls.Button()
  cleanupButton.Content = 'Detach input owner'
  cleanupButton.HorizontalAlignment = Microsoft.UI.Xaml.HorizontalAlignment.Right
  cleanupButton.VerticalAlignment = Microsoft.UI.Xaml.VerticalAlignment.Top
  root.Children.Append(cleanupButton)
  win.Content = root
  globalThis.gateWindow = win
  let attached = false
  panel.Loaded = NSWinRT.asDelegate('Microsoft.UI.Xaml.RoutedEventHandler', () => {
    if (attached) return
    attached = true
    try {
      const parent = { nativeViewProtected: panel, isLoaded: true }
      const child = { nativeViewProtected: button, isLoaded: true, parent }
      log({
        descriptions: [parent, child].map((view) =>
          JSON.parse(
            NSWinRT.dotnet.invoke('', 'OctaneXplat.Input.GestureInput', 'Describe', [
              view.nativeViewProtected,
            ]),
          ),
        ),
      })
      const pan = createPanController({
        axis: 'x',
        onStart: () => log({ kind: 'start' }),
        onUpdate: (sample) => log({ kind: 'move', translation: sample.translation }),
        onFinalize: (terminal) => log({ kind: 'finish', outcome: terminal.outcome }),
      })
      const off = attachWindowsGesture(parent, pan.handle)
      const press = attachWindowsPress(child, {
        slop: 8,
        longPressDelay: 500,
        onLongPress: () => log({ kind: 'long' }),
        onDoublePress: () => log({ kind: 'double' }),
        onPress: (event) => log({ kind: 'press', source: event.source }),
      })
      const offAction = observeWindowsActionControl(
        button,
        () => {
          log({ nativeClick: windowsActivationSource(button) })
          dispatchWindowsActivation(child, windowsActivationSource(button))
        },
        () => {},
      )
      globalThis.gateDispose = () => {
        offAction()
        press.dispose()
        off()
        pan.dispose()
      }
      log({
        ready: true,
        owner: true,
        scale: root.XamlRoot.RasterizationScale,
        width: button.ActualWidth,
      })
      const offCleanup = observeWindowsActionControl(
        cleanupButton,
        () => {
          try {
            globalThis.gateDispose()
            offCleanup()
            log({ disposed: true })
          } catch (error) {
            log({ error: String(error), stack: error.stack, stage: 'dispose' })
          }
        },
        () => {},
      )
    } catch (error) {
      log({ error: String(error), stack: error.stack })
    }
  })
  win.Activate()
} catch (error) {
  log({ error: String(error), stack: error.stack })
}
