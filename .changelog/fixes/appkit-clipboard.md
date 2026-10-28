AppKit `clipboard.canCopy` now recognizes hosts that can write without reading.
Missing or failing clipboard operations resolve false for writes and null for
reads. The UI `copyText` helper uses the same platform writer.
