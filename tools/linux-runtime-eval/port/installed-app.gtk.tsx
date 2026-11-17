/// <reference types="@octane-xplat/linux-gtk/gi" />
/** @jsxImportSource @octane-xplat/jsx */
import { runGtkApp } from '@octane-xplat/linux-gtk/host'
import { getNativeGtkMajorVersion } from './native-sdk-smoke.ts'

const title = 'GTK Runtime Consumer'

function App() {
  return <label id="installed-app-label" text={title} />
}

const version = getNativeGtkMajorVersion()
if (version !== 4) {
  throw new Error(`Expected GTK 4, received ${version}`)
}

let verified = false
const result = runGtkApp(
  { applicationId: 'org.octanexplat.RuntimeConsumer', title },
  ({ app, window, root, container }) => {
    root.render(App, {})
    window.connect('map', () => {
      const label = [...container.nodes.values()].find((node) => node.props.id === 'installed-app-label')
      verified = label?.view?.get_label() === title
      app.quit()
    })
  },
)

if (result !== 0 || !verified) {
  throw new Error(`GTK consumer failed to map its rendered label (exit ${result})`)
}
console.log(JSON.stringify({ installedGtkApp: true, gtkMajor: version }))
