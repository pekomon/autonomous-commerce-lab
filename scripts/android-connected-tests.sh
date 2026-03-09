#!/usr/bin/env bash

set -euo pipefail

readonly ANDROID_DIR="apps/android"
readonly LOG_DIR="$ANDROID_DIR/build/ci-connected-tests"
readonly REPORTS_DIR="$ANDROID_DIR/app/build/reports/androidTests"
readonly RESULTS_DIR="$ANDROID_DIR/app/build/outputs/androidTest-results"
readonly GRADLE_CMD=("./apps/android/gradlew" "-p" "apps/android" ":app:connectedDebugAndroidTest")

mkdir -p "$LOG_DIR"

wait_for_emulator_services() {
  adb wait-for-device

  until adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' | grep -q '^1$'; do
    sleep 2
  done

  until adb shell cmd package list packages >/dev/null 2>&1; do
    sleep 2
  done
}

copy_attempt_artifacts() {
  local attempt="$1"
  local attempt_dir="$LOG_DIR/$attempt"

  mkdir -p "$attempt_dir"

  if [ -d "$REPORTS_DIR" ]; then
    cp -R "$REPORTS_DIR" "$attempt_dir/reports"
  fi

  if [ -d "$RESULTS_DIR" ]; then
    cp -R "$RESULTS_DIR" "$attempt_dir/results"
  fi
}

run_connected_tests() {
  local attempt="$1"
  local log_file="$LOG_DIR/$attempt.log"

  set +e
  "${GRADLE_CMD[@]}" 2>&1 | tee "$log_file"
  local status=${PIPESTATUS[0]}
  set -e

  return "$status"
}

should_retry_for_bootstrap_failure() {
  local log_file="$1"

  grep -Eq \
    "adb protocol fault|Unable to connect to adb daemon|device offline|device 'emulator-[0-9]+' not found|Can't find service: (package|activity)|Failed to install split APK|Failed to start Emulator console|Broken pipe \(32\)" \
    "$log_file"
}

should_retry_for_transient_dependency_failure() {
  local log_file="$1"

  grep -Eq \
    "Could not resolve all files for configuration|Could not resolve [^[:space:]]+|Could not get resource 'https://|Could not (GET|HEAD) 'https://" \
    "$log_file" &&
    grep -Eq \
      "Received status code 50[234] from server|Bad Gateway|Gateway Timeout|Connection reset|Read timed out|Remote host terminated the handshake|Temporary failure in name resolution" \
      "$log_file"
}

print_retry_reason() {
  local log_file="$1"
  local reason="$2"

  echo "Connected tests failed due to ${reason}. Retrying once."
  echo "Matched failure lines:"
  grep -E \
    "adb protocol fault|Unable to connect to adb daemon|device offline|device 'emulator-[0-9]+' not found|Can't find service: (package|activity)|Failed to install split APK|Failed to start Emulator console|Broken pipe \(32\)|Received status code 50[234] from server|Bad Gateway|Gateway Timeout|Connection reset|Read timed out|Remote host terminated the handshake|Temporary failure in name resolution" \
    "$log_file" || true
}

main() {
  wait_for_emulator_services

  if run_connected_tests "attempt-1"; then
    exit 0
  fi

  copy_attempt_artifacts "attempt-1"

  if should_retry_for_bootstrap_failure "$LOG_DIR/attempt-1.log"; then
    print_retry_reason "$LOG_DIR/attempt-1.log" "emulator/bootstrap instability"

    adb kill-server || true
    adb start-server || true

    wait_for_emulator_services
  elif should_retry_for_transient_dependency_failure "$LOG_DIR/attempt-1.log"; then
    print_retry_reason "$LOG_DIR/attempt-1.log" "transient dependency download failures"
    sleep 10
  else
    echo "Connected tests failed without a retryable emulator/bootstrap or dependency-download signature."
    exit 1
  fi

  if run_connected_tests "attempt-2"; then
    exit 0
  fi

  copy_attempt_artifacts "attempt-2"
  exit 1
}

main "$@"
