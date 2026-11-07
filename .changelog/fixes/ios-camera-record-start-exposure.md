---
hype: 60
---

### Start iOS recordings without a brightness jump

On iOS, starting a recording restarted the camera pipeline, so the first fraction of a second of each movie came out dark and then brightened as exposure and white balance readjusted. The camera now prepares its recording connection for portrait (the default) when the preview starts, so a portrait recording keeps the exposure and white balance the preview already had. A take in a different orientation from the previous one can still readjust once when it starts. Rebuild your iOS app after upgrading so it includes the updated native recorder.

See [record a camera movie](https://octane-xplat.goddardai.org/movie-capture).
