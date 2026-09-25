#!/bin/sh
# Resolve the running Xcode PID dynamically — mcpbridge's auto-detect misses
# Xcode installed outside /Applications (this machine's is ~/dev/Library).
PID=$(pgrep -f 'Xcode.app/Contents/MacOS/Xcode' | head -1)
if [ -z "$PID" ]; then
  echo "mcpbridge-wrapper: no running Xcode — start it first" >&2
  exit 1
fi
exec env MCP_XCODE_PID="$PID" xcrun mcpbridge
