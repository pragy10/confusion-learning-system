import { TELEMETRY_EVENTS } from "./telemetry";

const REWIND_WINDOW_MS = 15000;
const REWIND_THRESHOLD = 3;

const PAUSE_PLAY_WINDOW_MS = 10000;
const PAUSE_PLAY_THRESHOLD = 4;

const SPEED_DROP_THRESHOLD = 0.5;

export function detectConfusion(events) {
  const now = Date.now();

  const recentEvents = events.filter(
    (event) => now - event.timestamp <= REWIND_WINDOW_MS
  );

  // ----------------------------------------
  // Pattern 1: Repeated rewinds
  // ----------------------------------------

  const recentRewinds = recentEvents.filter(
    (event) => event.type === TELEMETRY_EVENTS.REWIND
  );

  if (recentRewinds.length >= REWIND_THRESHOLD) {
    return {
      detected: true,
      reason: "REPEATED_REWINDS",
      videoTime:
        recentRewinds[recentRewinds.length - 1].to,
    };
  }

  // ----------------------------------------
  // Pattern 2: Rapid pause/play toggling
  // ----------------------------------------

  const recentPausePlayEvents = events.filter(
    (event) =>
      now - event.timestamp <= PAUSE_PLAY_WINDOW_MS &&
      (
        event.type === TELEMETRY_EVENTS.PAUSE ||
        event.type === TELEMETRY_EVENTS.PLAY
      )
  );

  if (recentPausePlayEvents.length >= PAUSE_PLAY_THRESHOLD) {
    return {
      detected: true,
      reason: "RAPID_PAUSE_PLAY",
      videoTime:
        recentPausePlayEvents[
          recentPausePlayEvents.length - 1
        ].videoTime,
    };
  }

  // ----------------------------------------
  // Pattern 3: Abrupt speed reduction
  // ----------------------------------------

  const recentSpeedDrops = events.filter(
    (event) =>
      event.type === TELEMETRY_EVENTS.SPEED_CHANGE &&
      now - event.timestamp <= REWIND_WINDOW_MS &&
      event.newRate < event.previousRate &&
      event.previousRate - event.newRate >= SPEED_DROP_THRESHOLD
  );

  if (recentSpeedDrops.length > 0) {
    return {
      detected: true,
      reason: "ABRUPT_SPEED_DROP",
      videoTime:
        recentSpeedDrops[
          recentSpeedDrops.length - 1
        ].videoTime,
    };
  }

  return {
    detected: false,
    reason: null,
    videoTime: null,
  };
}