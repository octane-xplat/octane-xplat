### Clear web escape attributes consistently

Web escape props now clear attributes when their values become `null` or `undefined` in Camera, AnimatedImage, Image, Lottie, and Video. Dashed attributes also use the same boolean handling across these components. See [platform escape props](https://octane-xplat.goddardai.org/app/components).
