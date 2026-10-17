// GTK app entry — bundled by xplatLinuxGtk into one ESM file; `gjs -m`
// executes it. `runGtkApp` owns the GtkApplication, window, content box, and
// the mounted universal root.
import { runGtkApp } from '@octane-xplat/linux-gtk/host'
import { App } from './App.gtk'

export function main(): number {
	return runGtkApp(
		{
			applicationId: 'dev.xplat.linux-gtk-smoke',
			title: 'Octane GTK smoke',
			defaultWidth: 480,
			defaultHeight: 320,
		},
		({ root }) => {
			root.render(App, {})
		},
	)
}

main()
