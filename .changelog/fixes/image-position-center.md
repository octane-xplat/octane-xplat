### Fix center serialization in image positions

Image position objects containing `center` now serialize to a valid 50%
edge offset instead of the invalid `centerpx` length.

When a position object supplies both edges on an axis, serialization now
uses top/left precedence to match the existing native layout math.
