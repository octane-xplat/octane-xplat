#!/bin/bash
# Editor package maintainers own this repeatable bridge diagnostic.
# Usage: bash compile.sh /path/to/pinned/lexical-ios /path/to/new/output-dir
set -euo pipefail
lexical_source=${1:?Supply the pinned lexical-ios checkout}
probe_output=${2:?Supply a new output directory}
mkdir "$probe_output"
sdk=$(xcrun --sdk iphonesimulator --show-sdk-path)
probe_dir=$(cd "$(dirname "$0")" && pwd)
compile_module() {
    local module=$1 source_dir=$2
    local sources=()
    while IFS= read -r source_file; do sources+=("$source_file"); done < <(find "$source_dir" -name '*.swift' -type f | sort)
    xcrun swiftc -sdk "$sdk" -target arm64-apple-ios13.0-simulator \
        -whole-module-optimization -emit-library -emit-module -module-name "$module" \
        -I "$probe_output" -L "$probe_output" -lLexical \
        "${sources[@]}" -o "$probe_output/lib$module.dylib"
}
# Core has no Swift package dependencies. HTML/Markdown plugins are intentionally excluded.
lexical_sources=()
while IFS= read -r source_file; do lexical_sources+=("$source_file"); done < <(find "$lexical_source/Lexical" -name '*.swift' -type f | sort)
xcrun swiftc -sdk "$sdk" -target arm64-apple-ios13.0-simulator \
    -whole-module-optimization -emit-library -emit-module -module-name Lexical \
    "${lexical_sources[@]}" -o "$probe_output/libLexical.dylib"
compile_module EditorHistoryPlugin "$lexical_source/Plugins/EditorHistoryPlugin/EditorHistoryPlugin"
compile_module LexicalListPlugin "$lexical_source/Plugins/LexicalListPlugin/LexicalListPlugin"
xcrun swiftc -sdk "$sdk" -target arm64-apple-ios13.0-simulator \
    -whole-module-optimization -emit-library -emit-module -module-name SurfaceProbe \
    -emit-objc-header-path "$probe_output/SurfaceProbe-Swift.h" \
    -I "$probe_output" -L "$probe_output" -lLexical -lEditorHistoryPlugin -lLexicalListPlugin \
    "$probe_dir/SurfaceProbe.swift" -o "$probe_output/libSurfaceProbe.dylib"
xcrun clang -isysroot "$sdk" -target arm64-apple-ios13.0-simulator \
    -fobjc-arc -I "$probe_output" -L "$probe_output" -lSurfaceProbe \
    -framework UIKit -framework Foundation -dynamiclib \
    "$probe_dir/ObjCConsumer.m" -o "$probe_output/libObjCConsumer.dylib"
echo 'PASS: Lexical core + history + lists + custom ElementNode + Swift/Objective-C consumer compile/link'
echo 'NOT RUN: NativeScript metadata, app mount, OS input, semantic roundtrip, VoiceOver'
