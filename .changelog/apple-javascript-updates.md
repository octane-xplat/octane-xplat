---
hype: 50
---

### Update more Apple integrations without rebuilding

Eight packages replace their Apple Swift backends with TypeScript over the host's Objective-C bridge. Installing or updating these integrations now needs only a JavaScript refresh on the listed platforms; their public APIs and behavior are unchanged.

| Package | Platforms that no longer need a plugin rebuild |
| --- | --- |
| [GIF](https://octane-xplat.goddardai.org/package-gif) | macOS |
| [Print](https://octane-xplat.goddardai.org/package-print) | iOS |
| [Recorder](https://octane-xplat.goddardai.org/package-recorder) | macOS |
| [Richtext](https://octane-xplat.goddardai.org/package-richtext) | macOS |
| [Splash screen](https://octane-xplat.goddardai.org/package-splash-screen) | iOS |
| [Tracking transparency](https://octane-xplat.goddardai.org/package-tracking-transparency) | iOS |
| [Video](https://octane-xplat.goddardai.org/package-video) | macOS |
| [View shot](https://octane-xplat.goddardai.org/package-view-shot) | iOS and macOS |

macOS printing retains its Swift backend because the TypeScript port could not reliably detect print completion. Android bridges still require a rebuild. Other platforms are unchanged.
