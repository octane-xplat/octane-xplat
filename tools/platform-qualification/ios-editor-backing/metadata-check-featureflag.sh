#!/bin/bash
# Workaround variant of metadata-check.sh: injects
#   -Xclang -fmodule-feature -Xclang found_incompatible_headers__check_search_paths
#   -D__STDC_WANT_LIB_EXT1__=0
# into the clang argument section, at the position OTHER_CFLAGS occupies in
# build-step-metadata-generator.py (after framework search paths, before
# preprocessor defines and -fmodules). In the real build the -Xclang pair
# arrives via OTHER_CFLAGS in apps/mobile/App_Resources/iOS/build.xcconfig;
# the -D could equally ride GCC_PREPROCESSOR_DEFINITIONS.
#
# -fmodule-feature makes the SDK 27 modulemap's _c_standard_library_obsolete
# module available (it `requires` a clang feature newer than the bundled
# clang 17). That alone leaves exactly one real error: the now-available
# obsolete stub stddef.h does not honour __need_rsize_t, so Annex K's
# rsize_t stays undefined and _string.h fails. -D__STDC_WANT_LIB_EXT1__=0
# removes the rsize_t demand site; every SDK use is guarded by
# `defined() && >= 1`. Cost: Annex K decls (memset_s et al.) drop from
# metadata.
#
# Usage: bash metadata-check-featureflag.sh /path/to/metadata-generator/bin /path/to/probe-output /path/to/new/output-dir
set -euo pipefail
gen_dir=${1:?Supply the metadata-generator-arm64/bin directory}
probe_output=${2:-}
meta_output=${3:?Supply a new output directory}
mkdir -p "$meta_output/ts" "$meta_output/fw"
sdk=$(xcrun --sdk iphonesimulator --show-sdk-path)
sdk_version=$(xcrun --sdk iphonesimulator --show-sdk-version)

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
    -D__STDC_WANT_LIB_EXT1__=0 \
    -target "arm64-apple-ios${sdk_version}-simulator" \
    -F"$sdk/System/Library/Frameworks" \
    -F"$sdk/System/Library/SubFrameworks" \
    -F"$meta_output/fw" \
    -Xclang -fmodule-feature -Xclang found_incompatible_headers__check_search_paths \
    -I. -fmodules 2> "$meta_output/metadata-generation-stderr-arm64.txt"
echo "PASS: metadata generated; inspect $meta_output/ts and $meta_output/yaml for dropped declarations"
