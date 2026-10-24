Fixed `Button` differences from Astryx's default button:

- A loading button no longer fades out as if it were disabled.
- Long labels now end in an ellipsis instead of overflowing the button.
- The loading spinner is now Astryx's small 14px ring, on web and native.
- On native, a loading button keeps its label in place underneath the spinner instead of being replaced by it, so its size and accessible name don't change. While busy it announces `accessibilityValue: "Loading"`.
