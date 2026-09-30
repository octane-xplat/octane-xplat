#!/bin/sh
# Rebuilds platforms/ios/Resources/*.metallib from metal/OctaneShaders.metal.
#
# Plugin-dir .metal sources land in the app target's Resources phase — the
# CLI only places recognised source extensions (.swift/.m/.c/...) in Sources —
# so the leaf ships precompiled libraries and loads them at runtime with
# ShaderLibrary(url:). Device and simulator need separate air triples, hence
# two outputs; XplatBundledShaders.swift picks one per targetEnvironment.
set -e
cd "$(dirname "$0")/.."

OUT=platforms/ios/Resources

compile() {
	sdk=$1
	min=$2
	out=$3
	xcrun -sdk "$sdk" metal -c "$min=17.0" -o "$OUT/$out.air" metal/OctaneShaders.metal
	xcrun -sdk "$sdk" metallib "$OUT/$out.air" -o "$OUT/$out.metallib"
	rm "$OUT/$out.air"
}

compile iphoneos -mios-version-min OctaneShaders
compile iphonesimulator -mios-simulator-version-min OctaneShaders.sim
