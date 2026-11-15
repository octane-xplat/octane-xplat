#!/usr/bin/env bash
# Run one native-prerender qualification control end to end: producer (Android),
# build, device run, report. Reuses the pinned iOS simulator and the
# elegant-fir-probe AVD; the run scripts boot and shut down the iOS simulator
# and the Android Home emulator themselves.
#
# Usage:
#   test-prerender.sh <platform> <control> [dir]
#
#   platform  ios | android
#
#   iOS controls      home | keyed | seed-mismatch | attach-failure | all
#   Android controls  home | fallback-seed | fallback-attach | keyed | all
#   Custom screen     <platform> app <dir>
#                     <dir> holds startup.config.json plus the .tsrx/.css
#                     sources it names; copy custom-template/ to start.
#
# Paths resolve automatically from this repository; override with the
# environment variables below when a prerelease lives elsewhere.
#
#   PRERENDER_MASON_DIST   Prepared @octane-xplat/nativescript-mason-core dist
#                          that contains adoption.js (the attached-native seam).
#   PRERENDER_DRIVER_ROOT  Built @octane-xplat/nativescript-octane package root
#                          (needs dist/index.js). Android only.
#   PRERENDER_ANDROID_RUNTIME_ROOT   @nativescript/android package root.
#   PRERENDER_CORE_ROOT              @nativescript/core package root.
#   XPLAT_PRERENDER_ANDROID_SDK      Android SDK root (default $ANDROID_HOME
#                                    or ~/Library/Android/sdk).
#   XPLAT_PRERENDER_JAVA_HOME        JDK 17 home (default: /usr/libexec/java_home -v 17).

set -euo pipefail

SOURCE="$(cd "$(dirname "$(realpath "${BASH_SOURCE[0]}")")" && pwd)"
REPO="$(cd "$SOURCE/../../.." && pwd)"
PKG="@xplat/platform-qualification"

platform="${1:-}"
control="${2:-}"
custom_dir="${3:-}"

usage() {
  sed -n '2,30p' "${BASH_SOURCE[0]}"
  exit "${1:-1}"
}

[ -n "$platform" ] && [ -n "$control" ] || usage
case "$platform" in ios | android) ;; *) usage ;; esac

turbo() {
  (cd "$REPO" && bun turbo run "$1" --filter="$PKG")
}

last_dir() {
  # Print the newest run-* directory under a scratch parent that has a
  # build.json (a failed build may leave a partial directory).
  local d
  for d in $(ls -dt "$1"/run-* 2>/dev/null); do
    [ -f "$d/build.json" ] && { echo "$d"; return 0; }
  done
  return 1
}

MASON_DIST="${PRERENDER_MASON_DIST:-/Users/alec/dev/octane-xplat/worktrees/nativescript-mason/adopt-attached/dist/packages/nativescript-mason-core}"
if [ ! -f "$MASON_DIST/adoption.js" ]; then
  echo "error: $MASON_DIST has no adoption.js." >&2
  echo "Point PRERENDER_MASON_DIST at a prepared nativescript-mason-core dist" >&2
  echo "built from the adopt-attached worktree (beta.10 + adoption seam)." >&2
  exit 2
fi

run_ios() {
  local name="$1" fixture="$2" mode="$3" dir="${4:-}"
  echo "=== ios/$name: build ==="
  XPLAT_PRERENDER_IOS_MASON_PACKAGE="$MASON_DIST" \
  XPLAT_PRERENDER_IOS_STARTUP_FIXTURE="$fixture" \
  XPLAT_PRERENDER_IOS_STARTUP_MODE="$mode" \
  XPLAT_PRERENDER_IOS_STARTUP_DIR="$dir" \
    turbo probe:prerender:sdk:startup:ios:build
  local build
  build="$(last_dir "$HOME/agent-scratch/octane-xplat/native-prerender-sdk-startup-ios")"
  [ -n "$build" ] || { echo "error: no iOS build directory produced" >&2; return 1; }
  echo "=== ios/$name: run ($build) ==="
  XPLAT_PRERENDER_IOS_SDK_STARTUP_BUILD="$build" \
    turbo probe:prerender:sdk:startup:ios
}

first_existing() {
  local p
  for p in "$@"; do [ -e "$p" ] && { echo "$p"; return 0; }; done
  return 1
}

prepare_android_env() {
  RUNTIME_ROOT="${PRERENDER_ANDROID_RUNTIME_ROOT:-$(first_existing \
    "$REPO/apps/mobile/node_modules/@nativescript/android" \
    "$REPO/node_modules/@nativescript/android" || true)}"
  CORE_ROOT="${PRERENDER_CORE_ROOT:-$(first_existing \
    "$REPO/apps/mobile/node_modules/@nativescript/core" \
    "$REPO/node_modules/@nativescript/core" || true)}"
  DRIVER_ROOT="${PRERENDER_DRIVER_ROOT:-$(first_existing \
    "$REPO/packages/nativescript-octane" \
    "$HOME/agent-scratch/octane-xplat/native-prerender-canonical-driver/consumer/node_modules/@nativescript-community/octane" || true)}"
  ANDROID_SDK="${XPLAT_PRERENDER_ANDROID_SDK:-${ANDROID_HOME:-$HOME/Library/Android/sdk}}"
  JAVA_HOME_VAL="${XPLAT_PRERENDER_JAVA_HOME:-$(first_existing \
    /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
    "$(/usr/libexec/java_home -v 17 2>/dev/null || true)" || true)}"
  for v in RUNTIME_ROOT CORE_ROOT DRIVER_ROOT ANDROID_SDK JAVA_HOME_VAL; do
    [ -n "${!v}" ] || { echo "error: could not resolve $v; set the matching env override" >&2; exit 2; }
  done
  [ -f "$DRIVER_ROOT/dist/index.js" ] || {
    echo "error: $DRIVER_ROOT has no dist/index.js; build @octane-xplat/nativescript-octane first" >&2
    exit 2
  }
}

produce_android() {
  local config="$1"
  case "$config" in /*) ;; *) config="$SOURCE/producer/$config" ;; esac
  XPLAT_PRERENDER_HOME_PLATFORM=android \
  XPLAT_PRERENDER_PRODUCER_CONFIG="$config" \
    turbo probe:prerender:home:produce
  PRODUCER="$(last_dir "$HOME/agent-scratch/octane-xplat/native-prerender-home-producer")"
  [ -n "$PRODUCER" ] || { echo "error: no producer output produced" >&2; exit 1; }
}

build_android() {
  local name="$1"; shift
  echo "=== android/$name: build ==="
  # env applies leading NAME=VALUE arguments, so the per-control flags in "$@"
  # can ride along with the shared roots.
  env \
    XPLAT_PRERENDER_ANDROID_RUNTIME_ROOT="$RUNTIME_ROOT" \
    XPLAT_PRERENDER_CORE_ROOT="$CORE_ROOT" \
    XPLAT_PRERENDER_ANDROID_MASON_SDK="$MASON_DIST/platforms/android" \
    XPLAT_PRERENDER_ANDROID_MASON_RUNTIME_ROOT="$MASON_DIST" \
    XPLAT_PRERENDER_ANDROID_SDK="$ANDROID_SDK" \
    XPLAT_PRERENDER_JAVA_HOME="$JAVA_HOME_VAL" \
    XPLAT_PRERENDER_ANDROID_HOME_DRIVER_ROOT="$DRIVER_ROOT" \
    XPLAT_PRERENDER_ANDROID_HOME_PRODUCER="$PRODUCER" \
    "$@" \
    bun --cwd "$REPO" turbo run probe:prerender:android:build --filter="$PKG"
  ANDROID_BUILD="$(last_dir "$HOME/agent-scratch/octane-xplat/native-prerender-android")" || {
    echo "error: no Android build directory produced" >&2
    exit 1
  }
}

run_android_home() {
  local name="$1"
  echo "=== android/$name: run ($ANDROID_BUILD) ==="
  XPLAT_PRERENDER_ANDROID_BUILD="$ANDROID_BUILD" \
    turbo probe:prerender:android
}

run_android_keyed() {
  local adb="$ANDROID_SDK/platform-tools/adb"
  local emu="$ANDROID_SDK/emulator/emulator"
  if "$adb" devices | grep -q '^emulator-'; then
    echo "error: an emulator is already running; kill it before the keyed control" >&2
    exit 3
  fi
  mkdir -p "$HOME/agent-scratch/octane-xplat"
  "$emu" -avd elegant-fir-probe -port 5566 -no-window -no-audio \
    -no-snapshot-load -no-snapshot-save -no-boot-anim -gpu swiftshader_indirect \
    > "$HOME/agent-scratch/octane-xplat/prerender-keyed-emulator.log" 2>&1 &
  KEYED_EMU_PID=$!
  trap 'kill_keyed_emulator' EXIT
  local booted=0 i
  for i in $(seq 1 240); do
    [ "$("$adb" -s emulator-5566 shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] && { booted=1; break; }
    sleep 1
  done
  if [ "$booted" != "1" ]; then
    echo "error: emulator boot timed out" >&2
    kill_keyed_emulator
    trap - EXIT
    exit 4
  fi
  echo "=== android/keyed: run ($ANDROID_BUILD) ==="
  XPLAT_PRERENDER_ANDROID_BUILD="$ANDROID_BUILD" \
  XPLAT_PRERENDER_ANDROID_DEVICE_SERIAL=emulator-5566 \
    turbo probe:prerender:mount:android
  kill_keyed_emulator
  trap - EXIT
}

kill_keyed_emulator() {
  "$ANDROID_SDK/platform-tools/adb" -s emulator-5566 emu kill 2>/dev/null || true
  if [ -n "${KEYED_EMU_PID:-}" ]; then
    kill "$KEYED_EMU_PID" 2>/dev/null || true
    wait "$KEYED_EMU_PID" 2>/dev/null || true
  fi
}

android_one() {
  local name="$1" producer_config="$2"; shift 2
  prepare_android_env
  produce_android "$producer_config"
  build_android "$name" "$@"
  case "$name" in
    keyed) run_android_keyed ;;
    *) run_android_home "$name" ;;
  esac
}

require_custom_dir() {
  [ -n "$custom_dir" ] || usage
  [ -f "$custom_dir/startup.config.json" ] || {
    echo "error: $custom_dir/startup.config.json missing" >&2
    echo "Copy $SOURCE/custom-template and edit it." >&2
    exit 2
  }
  custom_dir="$(cd "$custom_dir" && pwd)"
}

case "$platform:$control" in
  ios:app)
    require_custom_dir
    run_ios app custom adopt "$custom_dir"
    ;;
  android:app)
    require_custom_dir
    prepare_android_env
    produce_android "$custom_dir/startup.config.json"
    build_android app XPLAT_PRERENDER_ANDROID_CUSTOM_ADOPT=1
    run_android_keyed
    ;;
  ios:home)           run_ios home home adopt ;;
  ios:keyed)          run_ios keyed keyed adopt ;;
  ios:seed-mismatch)  run_ios seed-mismatch keyed seed-mismatch ;;
  ios:attach-failure) run_ios attach-failure keyed attach-failure ;;
  ios:all)
    run_ios home home adopt
    run_ios keyed keyed adopt
    run_ios seed-mismatch keyed seed-mismatch
    run_ios attach-failure keyed attach-failure
    ;;
  android:home)
    android_one home home.config.json \
      XPLAT_PRERENDER_ANDROID_HOME_ADOPT=1 \
      XPLAT_PRERENDER_ANDROID_HOME_PARITY=1 \
      XPLAT_PRERENDER_ANDROID_HOME_INPUT=1 \
      XPLAT_PRERENDER_ANDROID_HOME_APPLICATION=1 \
      XPLAT_PRERENDER_ANDROID_HOME_ENTRY=1 \
      XPLAT_PRERENDER_ANDROID_HOME_RESTORE=1
    ;;
  android:fallback-seed)
    android_one fallback-seed home.config.json \
      XPLAT_PRERENDER_ANDROID_HOME_ADOPT=1 \
      XPLAT_PRERENDER_ANDROID_HOME_APPLICATION=1 \
      XPLAT_PRERENDER_ANDROID_HOME_FALLBACK=seed
    ;;
  android:fallback-attach)
    android_one fallback-attach home.config.json \
      XPLAT_PRERENDER_ANDROID_HOME_ADOPT=1 \
      XPLAT_PRERENDER_ANDROID_HOME_APPLICATION=1 \
      XPLAT_PRERENDER_ANDROID_HOME_FALLBACK=attach
    ;;
  android:keyed)
    android_one keyed fixtures/keyed-startup.json \
      XPLAT_PRERENDER_ANDROID_ARTIFACT_ADOPT=1
    ;;
  android:all)
    "$0" android home
    "$0" android fallback-seed
    "$0" android fallback-attach
    "$0" android keyed
    ;;
  *) usage ;;
esac
