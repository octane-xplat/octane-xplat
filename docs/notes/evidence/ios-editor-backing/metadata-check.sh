#!/bin/bash
# Faithful reproduction of the NativeScript iOS metadata build step for the
# iOS editor backing-surface diagnostic. Mirrors
# @nativescript/ios .../metadata-generator-arm64/bin/build-step-metadata-generator.py
# for the arm64 iphonesimulator slice only.
#
# Usage: bash metadata-check.sh /path/to/metadata-generator/bin /path/to/probe-output /path/to/new/output-dir
#   $1 = dir containing objc-metadata-generator (run from there, like the Xcode build step)
#   $2 = compile.sh output dir (must contain SurfaceProbe-Swift.h); may be empty/missing to skip the adapter module
#   $3 = new output directory for metadata artifacts
set -euo pipefail
gen_dir=${1:?Supply the metadata-generator-arm64/bin directory}
probe_output=${2:-}
meta_output=${3:?Supply a new output directory}
mkdir -p "$meta_output/ts" "$meta_output/fw"
sdk=$(xcrun --sdk iphonesimulator --show-sdk-path)
sdk_version=$(xcrun --sdk iphonesimulator --show-sdk-version)

# Wrap the generated Swift/ObjC facade header as a framework module so the
# generator serializes it the way it would for an app plugin framework.
if [ -n "$probe_output" ] && [ -f "$probe_output/SurfaceProbe-Swift.h" ]; then
    fw="$meta_output/fw/XplatEditorSurface.framework"
    mkdir -p "$fw/Headers" "$fw/Modules"
    cp "$probe_output/SurfaceProbe-Swift.h" "$fw/Headers/SurfaceProbe-Swift.h"
    cat > "$fw/Modules/module.modulemap" <<'EOF'
framework module XplatEditorSurface {
    umbrella header "SurfaceProbe-Swift.h"
    export *
}
EOF
fi

cd "$gen_dir"
# Invocation mirrors generate_metadata() in build-step-metadata-generator.py:
#   -target <arch>-apple-ios<SDK_VERSION>   (the script uses SDK_VERSION, not the deployment target)
#   -fmodules -I. for clang resource includes, plus the NS generator define seen in the cc1 line
#   -F covers the SDK frameworks and the adapter framework dir
./objc-metadata-generator -verbose \
    -output-bin "$meta_output/metadata-arm64.bin" \
    -output-umbrella "$meta_output/umbrella-arm64.h" \
    -docset-path "$HOME/Library/Developer/Shared/Documentation/DocSets/com.apple.adc.documentation.iOS.docset" \
    -output-typescript "$meta_output/ts" \
    -output-yaml "$meta_output/yaml" \
    Xclang \
    -isysroot "$sdk" \
    -std=gnu11 \
    -D__NATIVESCRIPT_METADATA_GENERATOR=1 \
    -target "arm64-apple-ios${sdk_version}-simulator" \
    -F"$sdk/System/Library/Frameworks" \
    -F"$sdk/System/Library/SubFrameworks" \
    -F"$meta_output/fw" \
    -I. -fmodules 2> "$meta_output/metadata-generation-stderr-arm64.txt"
echo "PASS: metadata generated; inspect $meta_output/ts and $meta_output/yaml for dropped declarations"
