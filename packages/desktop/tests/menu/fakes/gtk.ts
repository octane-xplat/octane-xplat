// Minimal Gtk fake — Application extends the Gio fake so
// `instanceof Gtk.Application` works exactly like GJS.
import Gio from './gio'

export class Application extends Gio.Application {}

export function accelerator_parse(accelerator: string): [number, number] {
  return accelerator.includes('bogus') ? [0, 0] : [1, 0]
}

export default { Application, accelerator_parse }
