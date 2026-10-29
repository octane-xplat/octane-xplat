# Android print callbacks

The two small android.print callback subclasses follow the constructor-access
pattern used by Expo Print. Android SDK stubs make the callback constructors
package-visible, so these uniquely named subclasses live in android.print.
The engine itself lives in com.octanexplat.print. Runtime behavior remains
unverified under the user's Android qualification policy.

Reference: [Expo Print callbacks](https://github.com/expo/expo/tree/57.0.20/packages/expo-print/android/src/main/java/expo/modules/print).
This is an SDK visibility workaround, not evidence that arbitrary hidden Android
APIs are supported. Preserve the boundary and qualify it on device before release.

The MIT License (MIT)

Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
