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
#   --run   Skip produce/build and reuse the newest matching build. The
#           run scripts verify recorded source hashes (including the
#           custom screen files) and reject a stale build, so editing
#           sources still requires a rebuild.
#
#   --shutdown
#           Shut down the simulator/emulator after the run. By default
#           the device is left running so a rerun skips the boot.
#
#   clean   Prune accumulated run-* directories: keeps the newest build
#           per control (so --run still resolves), the newest producer
#           output, and the newest --keep-reports report directories per
#           suite. Also runs automatically after each control. Extra
#           flags pass through to prune-runs.mjs:
#             test-prerender.sh clean --dry-run --keep-reports 10
#           Set XPLAT_PRERENDER_NO_PRUNE=1 to disable automatic pruning.
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

if [ "${1:-}" = "clean" ]; then
  shift
  exec node "$SOURCE/prune-runs.mjs" "$@"
fi

run_only=0
keep_device=1
rest=()
for arg in "$@"; do
  case "$arg" in
    --run) run_only=1 ;;
    --keep-device) keep_device=1 ;;
    --shutdown) keep_device=0 ;;
    *) rest+=("$arg") ;;
  esac
done
if [ ${#rest[@]} -gt 0 ]; then set -- "${rest[@]}"; else set --; fi

platform="${1:-}"
control="${2:-}"
custom_dir="${3:-}"
run_flag=""
[ "$run_only" = 1 ] && run_flag="--run"
device_flag=""
[ "$keep_device" = 0 ] && device_flag="--shutdown"

usage() {
  sed -n '2,34p' "${BASH_SOURCE[0]}"
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

find_ios_build() {
  local fixture="$1" mode="$2" dir="${3:-}" d
  for d in $(ls -dt "$HOME/agent-scratch/octane-xplat/native-prerender-sdk-startup-ios"/run-* 2>/dev/null); do
    [ -f "$d/build.json" ] || continue
    grep -q "\"startupFixture\": \"$fixture\"" "$d/build.json" || continue
    grep -q "\"startupMode\": \"$mode\"" "$d/build.json" || continue
    if [ -n "$dir" ] && ! grep -qF "\"$dir/" "$d/build.json"; then continue; fi
    echo "$d"
    return 0
  done
  echo "error: no matching ios/$fixture ($mode) build found; run without --run first" >&2
  return 1
}

find_android_build() {
  local pattern="$1" dir="${2:-}" d
  for d in $(ls -dt "$HOME/agent-scratch/octane-xplat/native-prerender-android"/run-* 2>/dev/null); do
    [ -f "$d/build.json" ] || continue
    grep -q "$pattern" "$d/build.json" || continue
    if [ -n "$dir" ] && ! grep -qF "\"$dir/" "$d/build.json"; then continue; fi
    echo "$d"
    return 0
  done
  echo "error: no matching android build found; run without --run first" >&2
  return 1
}

run_ios() {
  local name="$1" fixture="$2" mode="$3" dir="${4:-}"
  local build
  if [ "$run_only" = 1 ]; then
    build="$(find_ios_build "$fixture" "$mode" "$dir")" || return 1
    echo "=== ios/$name: reusing $build ==="
  else
    echo "=== ios/$name: build ==="
    XPLAT_PRERENDER_IOS_MASON_PACKAGE="$MASON_DIST" \
    XPLAT_PRERENDER_IOS_STARTUP_FIXTURE="$fixture" \
    XPLAT_PRERENDER_IOS_STARTUP_MODE="$mode" \
    XPLAT_PRERENDER_IOS_STARTUP_DIR="$dir" \
      turbo probe:prerender:sdk:startup:ios:build
    build="$(last_dir "$HOME/agent-scratch/octane-xplat/native-prerender-sdk-startup-ios")"
    [ -n "$build" ] || { echo "error: no iOS build directory produced" >&2; return 1; }
  fi
  echo "=== ios/$name: run ($build) ==="
  XPLAT_PRERENDER_IOS_SDK_STARTUP_BUILD="$build" \
  XPLAT_PRERENDER_KEEP_DEVICE="$keep_device" \
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
  XPLAT_PRERENDER_KEEP_DEVICE="$keep_device" \
    turbo probe:prerender:android
}

run_android_keyed() {
  local adb="$ANDROID_SDK/platform-tools/adb"
  local emu="$ANDROID_SDK/emulator/emulator"
  local reused=0
  if "$adb" devices | grep -q '^emulator-'; then
    if "$adb" devices | grep -q '^emulator-5566[[:space:]]*device'; then
      local avd_name
      avd_name="$("$adb" -s emulator-5566 emu avd name 2>/dev/null | head -1 | tr -d '\r')"
      [ "$avd_name" = "elegant-fir-probe" ] || {
        echo "error: emulator-5566 is running a different AVD: $avd_name" >&2
        exit 3
      }
      reused=1
      echo "=== android/keyed: reusing booted emulator-5566 ==="
    else
      echo "error: a different emulator is already running; kill it before the keyed control" >&2
      exit 3
    fi
  fi
  if [ "$reused" = 0 ]; then
    mkdir -p "$HOME/agent-scratch/octane-xplat"
    "$emu" -avd elegant-fir-probe -port 5566 -no-window -no-audio \
      -no-snapshot-load -no-snapshot-save -no-boot-anim -gpu swiftshader_indirect \
      > "$HOME/agent-scratch/octane-xplat/prerender-keyed-emulator.log" 2>&1 &
    KEYED_EMU_PID=$!
    if [ "$keep_device" = 0 ]; then trap 'kill_keyed_emulator' EXIT; fi
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
  fi
  echo "=== android/keyed: run ($ANDROID_BUILD) ==="
  XPLAT_PRERENDER_ANDROID_BUILD="$ANDROID_BUILD" \
  XPLAT_PRERENDER_ANDROID_DEVICE_SERIAL=emulator-5566 \
  XPLAT_PRERENDER_KEEP_DEVICE="$keep_device" \
    turbo probe:prerender:mount:android
  if [ "$keep_device" = 0 ]; then
    kill_keyed_emulator
    trap - EXIT
  else
    echo "=== android/keyed: emulator-5566 left running ==="
  fi
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
  if [ "$run_only" = 1 ]; then
    local pattern
    case "$name" in
      home) pattern='"restore": true' ;;
      fallback-seed) pattern='"fallback": "seed"' ;;
      fallback-attach) pattern='"fallback": "attach"' ;;
      keyed) pattern='"artifactAdopt": true' ;;
      *) echo "error: no --run matcher for android/$name" >&2; exit 2 ;;
    esac
    ANDROID_BUILD="$(find_android_build "$pattern")" || exit 1
    echo "=== android/$name: reusing $ANDROID_BUILD ==="
  else
    produce_android "$producer_config"
    build_android "$name" "$@"
  fi
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
    if [ "$run_only" = 1 ]; then
      ANDROID_BUILD="$(find_android_build '"customAdopt": true' "$custom_dir")" || exit 1
      echo "=== android/app: reusing $ANDROID_BUILD ==="
    else
      produce_android "$custom_dir/startup.config.json"
      build_android app XPLAT_PRERENDER_ANDROID_CUSTOM_ADOPT=1
    fi
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
    "$0" android home $run_flag $device_flag
    "$0" android fallback-seed $run_flag $device_flag
    "$0" android fallback-attach $run_flag $device_flag
    "$0" android keyed $run_flag $device_flag
    ;;
  *) usage ;;
esac

if [ "${XPLAT_PRERENDER_NO_PRUNE:-0}" != "1" ]; then
  node "$SOURCE/prune-runs.mjs" || echo "warning: run pruning failed" >&2
fi
