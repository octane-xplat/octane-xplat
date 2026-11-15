import Gtk from 'gi://Gtk?version=4.0'
import Pango from 'gi://Pango'
import { installNativeMeasurement, parseFont } from './measurement.js'
import './intl.js'

let measurementLabel: Gtk.Label | undefined

function labelForMeasurement(): Gtk.Label {
	return (measurementLabel ??= new Gtk.Label({ label: '' }))
}

installNativeMeasurement((text, font) => {
	const parsed = parseFont(font)
	const description = Pango.FontDescription.new()
	description.set_family(parsed.family)
	description.set_absolute_size(parsed.size * Pango.SCALE)
	description.set_weight(parsed.weight)
	description.set_style(parsed.italic ? Pango.Style.ITALIC : Pango.Style.NORMAL)

	const layout = labelForMeasurement().create_pango_layout(text)
	layout.set_font_description(description)
	return layout.get_pixel_size()[0]
})
