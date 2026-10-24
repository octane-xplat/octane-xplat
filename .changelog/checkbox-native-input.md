On web, `CheckboxInput` now follows Astryx's checkbox. It renders a real `<input type="checkbox">` under the drawn box, with the label and description beside it and the status message in a tinted box below. The mixed state uses the input's `indeterminate` property instead of `aria-checked="mixed"`. The checked mark is now Astryx's check icon.

If your tests or CSS select `.vx-checkbox-row[role="checkbox"]` or check `aria-checked`, select `input[type="checkbox"]` and read `checked`/`indeterminate` instead.
