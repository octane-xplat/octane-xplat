#!/bin/sh
# Build + run the WKWebView stand-in for the Linux webview host.
# Usage: run.sh [--self-test] [url]   (default url: http://localhost:5201)
set -e
cd "$(dirname "$0")"
mkdir -p .build
swiftc -O -o .build/WKHost WKHost.swift -framework Cocoa -framework WebKit
exec .build/WKHost "$@"
