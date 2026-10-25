### Switch renders a native input on web

On web, `Switch` now follows Astryx's switch. It renders a real `<input type="checkbox" role="switch">` over the drawn track, with the label and description beside it and the status message below. A loading switch shows a spinner in the thumb and announces "Loading" to screen readers. On every platform, the track is now Astryx's size (40×24, or 32×20 for `size="sm"`), and the thumb grows when the switch is on.

If your tests select `.vx-switch[role="switch"]` or check `aria-checked`, select `input[role="switch"]` and read `checked` instead. `testID` now lands on the switch's outer element, as it does in Astryx.
