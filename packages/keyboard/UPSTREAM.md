# Keyboard implementation references

The separation of measured keyboard frames, native movement bindings, focused
input geometry, and scroll policy is informed by
[react-native-keyboard-controller 1.22.0](https://github.com/kirillzyusko/react-native-keyboard-controller/tree/b80086f1207e36d634f93afabb65eb886fe1a2fe)
(MIT; copyright 2021 Kiryl Ziusko). This package does not copy its React
Native/Reanimated implementation or private keyboard-view discovery.

Native adapters use the public UIKit keyboard layout guide and CADisplayLink,
and AndroidX WindowInsetsAnimationCompat on an owned helper view. NativeScript
Page inset distribution is leased through its public androidOverflowInset event.
The package owns these helpers and releases them with its final window reader.
