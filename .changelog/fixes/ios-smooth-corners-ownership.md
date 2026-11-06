### Keep iOS smooth corners through layout updates

SmoothCorners now gives its exact generated curve to Mason’s clipping system. Normal iOS layout no longer treats the smooth clip as an unrelated overflow mask and removes it. Background and border shapes remain independent of whether children use visible or hidden overflow.

[SmoothCorners documentation](https://octane-xplat.goddardai.org/package-smooth-corners).
