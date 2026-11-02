#!/bin/bash
# In-guest orchestrator for the bounded GJS/GTK proof run.
# Provenance: byte-for-byte derivative of Boss deliverable
# 21b03833-bda7-4b30-b053-65f5d7cfdb93, evidence/scripts/guest-orchestrate.sh
# (SHA-256 9ce44a1648a8fd77982d0f6b2c076ce5420f280a4781c4fbc0bc7e43762f6f2f).
# The retained archive is immutable; fixes and controlled fixture seams live here.
# Runs on the guest's real Xorg session (DISPLAY=:0). Launches the proof
# bundle under gjs, polls the JSONL evidence log for `await-input` tokens,
# injects real OS input through the XTEST extension via xdotool (contract
# tier B), then writes the per-token `.done` handshake the app polls for.
# Every injected action is logged with mechanism "xtest/xdotool" so the
# report can separate actual OS-input evidence from instrumentation.
set -uo pipefail

WORK="${PROOF_WORK:-/home/debian/gtk-proof}"
LOG="$WORK/proof-log.jsonl"
INPUTS="$WORK/inputs"
OLOG="$WORK/orchestrator.jsonl"
BUNDLE="$WORK/proof-bundle.mjs"
PROOF_EXECUTABLE="${PROOF_EXECUTABLE:-gjs}"
RUN_TIMEOUT_SECONDS="${PROOF_TIMEOUT_SECONDS:-600}"
SHUTDOWN_BOUND_SECONDS=5
case "$RUN_TIMEOUT_SECONDS" in
	''|*[!0-9]*) echo 'PROOF_TIMEOUT_SECONDS must be an integer from 1 to 600' >&2; exit 2 ;;
esac
if [ "$RUN_TIMEOUT_SECONDS" -lt 1 ] || [ "$RUN_TIMEOUT_SECONDS" -gt 600 ]; then
	echo 'PROOF_TIMEOUT_SECONDS must be an integer from 1 to 600' >&2
	exit 2
fi
export DISPLAY=:0
mkdir -p "$INPUTS"
rm -f "$INPUTS"/*.done
: > "$OLOG"
seq=0
olog() {
	seq=$((seq + 1))
	printf '{"seq":%d,"at":%s,"kind":"%s","data":%s}\n' \
		"$seq" "$(date +%s%3N)" "$1" "${2:-{\}}" >>"$OLOG"
}

rect() { # domId → "x y w h" (last logged target-rect)
	grep '"phase":"target-rect"' "$LOG" 2>/dev/null |
		grep "\"domId\":\"$1\"" | tail -1 |
		jq -r '[.kind.x, .kind.y, .kind.w, .kind.h] | @tsv' 2>/dev/null
}
center() { # domId → "cx cy"
	read -r x y w h <<<"$(rect "$1")"
	[ -z "${x:-}" ] && return 1
	printf '%d %d' "$((${x%.*} + ${w%.*} / 2))" "$((${y%.*} + ${h%.*} / 2))"
}

app_running() {
	local state
	state=$(ps -o stat= -p "$APP_PID" 2>/dev/null | tr -d ' ')
	[ -n "$state" ] && [[ "$state" != Z* ]]
}

WID=""
WX=0
WY=0
resolve_window() {
	if [ -z "$WID" ]; then
		for _ in $(seq 1 60); do
			WID=$(xdotool search --name 'Octane GJS Proof' 2>/dev/null | tail -1)
			[ -n "$WID" ] && break
			sleep 0.5
		done
	fi
	# Re-read geometry every call — the window moves/resizes during the run.
	# xwininfo's absolute position is authoritative for a reparented client;
	# getwindowgeometry reports frame-biased coordinates under openbox.
	WX=$(xwininfo -id "$WID" 2>/dev/null | sed -n 's/.*Absolute upper-left X: *\(-\?[0-9]*\).*/\1/p')
	WY=$(xwininfo -id "$WID" 2>/dev/null | sed -n 's/.*Absolute upper-left Y: *\(-\?[0-9]*\).*/\1/p')
	olog window-state "{\"wid\":\"$WID\",\"x\":$WX,\"y\":$WY}"
}
# Click at window-relative (x,y) resolved to absolute screen coordinates.
# The window must be activated AND raised: under openbox a non-activated
# client's plate is not hit-testable and XTEST clicks die on the frame.
click_at() {
	resolve_window
	xdotool windowactivate --sync "$WID" 2>/dev/null || true
	xdotool windowraise "$WID" 2>/dev/null || true
	local ax=$((WX + $1)) ay=$((WY + $2))
	xdotool mousemove "$ax" "$ay" click 1
	local under
	under=$(xdotool getmouselocation --shell 2>/dev/null | grep '^WINDOW=' | cut -d= -f2)
	olog pointer-landing "{\"want\":\"$WID\",\"at\":[$ax,$ay],\"over\":\"$under\"}"
}
click_domid() {
	read -r cx cy <<<"$(center "$1")"
	if [ -z "${cx:-}" ]; then
		olog no-rect "{\"target\":\"$1\"}"
		return 1
	fi
	olog inject "{\"mechanism\":\"xtest/xdotool\",\"action\":\"click\",\"target\":\"$1\",\"at\":[$cx,$cy]}"
	click_at "$cx" "$cy"
}

handle_token() {
	case "$1" in
		click-activate)
			resolve_window
			xdotool windowactivate --sync "$WID" 2>/dev/null || true
			click_domid activate-button
			;;
		type-hello)
			# Click into the entry (real pointer focus), then real typing.
			click_domid edit-entry
			sleep 0.2
			olog inject '{"mechanism":"xtest/xdotool","action":"type","text":"hello"}'
			xdotool type --delay 50 'hello'
			sleep 0.2
			olog inject '{"mechanism":"xtest/xdotool","action":"key","key":"Return"}'
			xdotool key Return
			;;
		click-replaced)
			click_domid activate-button
			;;
		resized)
			olog inject '{"mechanism":"xtest/xdotool","action":"resize-loop","cycles":8}'
			for i in 0 1 2 3 4 5 6 7; do
				resolve_window
				if [ $((i % 2)) -eq 0 ]; then
					xdotool windowsize "$WID" 720 520
				else
					xdotool windowsize "$WID" 480 360
				fi
				sleep 0.3
				if [ "$i" -eq 3 ]; then click_domid activate-button; fi
			done
			xdotool windowsize "$WID" 560 420
			;;
		click-overlap)
			# Chip overlap: chip-a sits at fixed-local (10,10); the covered
			# point is fixed-local (55,30) → chip-a-local (45,20).
			read -r ax ay aw ah <<<"$(rect chip-a)"
			ox=$(( ${ax%.*} + 45 ))
			oy=$(( ${ay%.*} + 20 ))
			olog inject "{\"mechanism\":\"xtest/xdotool\",\"action\":\"click\",\"target\":\"chip-overlap\",\"at\":[$ox,$oy]}"
			click_at "$ox" "$oy"
			;;
		click-throw)
			click_domid activate-button
			;;
		close-window)
			# _NET_CLOSE_WINDOW makes openbox destroy the surface out from under
			# GDK (EGL assertion, abort). A real user's close goes through the
			# WM_DELETE protocol — drive it with a real keystroke instead.
			resolve_window
			xdotool windowactivate --sync "$WID" 2>/dev/null || true
			xdotool windowraise "$WID" 2>/dev/null || true
			olog inject '{"mechanism":"xtest/xdotool","action":"key","key":"alt+F4"}'
			xdotool key alt+F4
			# If the window survives, record what openbox actually did.
			sleep 1
			if xdotool search --name 'Octane GJS Proof' >/dev/null 2>&1; then
				olog inject '{"mechanism":"xtest/xdotool","action":"fallback-wm-close"}'
				xdotool windowclose "$WID" 2>/dev/null || true
			fi
			;;
		*)
			olog unknown-token "{\"token\":\"$1\"}"
			;;
	esac
}

olog orchestrator-start "{}"

# vCPU steal-time monitor: samples /proc/stat's aggregate steal field so the
# report can attribute any latency tail to host contention (or rule it out).
steal_prev=0
sseq=100000
(
	STEAL_SLEEP_PID=""
	trap 'if [ -n "$STEAL_SLEEP_PID" ]; then kill "$STEAL_SLEEP_PID" 2>/dev/null || true; wait "$STEAL_SLEEP_PID" 2>/dev/null || true; fi; exit' TERM
	while :; do
		steal=$(awk '/^cpu /{print $8}' /proc/stat 2>/dev/null || echo 0)
		delta=$((steal - steal_prev))
		steal_prev=$steal
		sseq=$((sseq + 1))
		printf '{"seq":%d,"at":%s,"kind":"%s","data":%s}\n' \
			"$sseq" "$(date +%s%3N)" "steal-ticks" "{\"cumulative\":$steal,\"delta2s\":$delta}" >>"$OLOG"
		sleep 2 &
		STEAL_SLEEP_PID=$!
		wait "$STEAL_SLEEP_PID"
	done
) &
STEAL_PID=$!
stop_steal_monitor() {
	kill -TERM "$STEAL_PID" 2>/dev/null || true
	wait "$STEAL_PID" 2>/dev/null || true
}
APP_PID=""
APP_CODE=0
TIMED_OUT=0
stop_owned_processes() {
	if [ -n "$APP_PID" ] && kill -0 "$APP_PID" 2>/dev/null; then
		kill -TERM "$APP_PID" 2>/dev/null || true
		for _ in $(seq 1 $((SHUTDOWN_BOUND_SECONDS * 20))); do
			kill -0 "$APP_PID" 2>/dev/null || break
			sleep 0.05
		done
		if kill -0 "$APP_PID" 2>/dev/null; then kill -KILL "$APP_PID" 2>/dev/null || true; fi
		wait "$APP_PID" 2>/dev/null || true
	fi
	stop_steal_monitor
}
trap stop_owned_processes EXIT INT TERM

# Remove any stale evidence log — the app recreates it on startup, and the
# poll loop must not consume a previous run's await-input markers.
rm -f "$LOG"

# Launch the proof app — the universal runtime runs entirely inside gjs.
PROOF_WORK="$WORK" "$PROOF_EXECUTABLE" -m "$BUNDLE" >"$WORK/app-stdout.log" 2>"$WORK/app-stderr.log" &
APP_PID=$!
olog app-launched "{\"pid\":$APP_PID}"

# Wait for the app to create the log, then poll by byte offset.
for _ in $(seq 1 100); do [ -f "$LOG" ] && break; sleep 0.2; done

offset=0
declare -A SEEN=()
deadline=$(( $(date +%s) + RUN_TIMEOUT_SECONDS ))
while app_running; do
	size=$(stat -c%s "$LOG" 2>/dev/null || echo 0)
	if [ "$size" -gt "$offset" ]; then
		# Advance offset by the bytes actually read — stat-then-tail can race
		# the app's writes and re-read trailing lines if offset lags.
		chunk=$(tail -c +$((offset + 1)) "$LOG")
		offset=$((offset + ${#chunk}))
		while IFS= read -r line; do
			case "$line" in
				*'"phase":"await-input"'*)
					token=$(printf '%s' "$line" | jq -r '.kind.token // empty')
					[ -z "$token" ] && continue
					[ -n "${SEEN[$token]:-}" ] && continue
					SEEN[$token]=1
					olog await-input "{\"token\":\"$token\"}"
					handle_token "$token" || olog inject-failed "{\"token\":\"$token\"}"
					touch "$INPUTS/$token.done"
					olog done-written "{\"token\":\"$token\"}"
					;;
				*'"kind":"all-phases-done"'*)
					olog run-complete '{}'
					;;
			esac
		done <<<"$chunk"
	fi
	[ "$(date +%s)" -ge "$deadline" ] && { olog timeout '{}'; TIMED_OUT=1; break; }
	sleep 0.2
done

if [ "$TIMED_OUT" -eq 1 ]; then
	stop_owned_processes
	APP_CODE=124
else
	wait "$APP_PID" 2>/dev/null
	APP_CODE=$?
	APP_PID=""
fi
# Final drain — the app can quit between the last poll and `wait`.
size=$(stat -c%s "$LOG" 2>/dev/null || echo 0)
if [ "$size" -gt "$offset" ]; then
	while IFS= read -r line; do
		case "$line" in
			*'"kind":"all-phases-done"'*) olog run-complete '{}' ;;
		esac
	done <<<"$(tail -c +$((offset + 1)) "$LOG")"
fi
olog app-exited "{\"code\":$APP_CODE}"
olog orchestrator-done '{}'
if [ "$TIMED_OUT" -eq 1 ]; then exit 124; fi
exit "$APP_CODE"
