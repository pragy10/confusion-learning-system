export const TELEMETRY_EVENTS = {
  PLAY: "PLAY",
  PAUSE: "PAUSE",
  SEEK: "SEEK",
  REWIND: "REWIND",
  FORWARD: "FORWARD",
  SPEED_CHANGE: "SPEED_CHANGE",
  CONFUSION_SIGNAL: "CONFUSION_SIGNAL",
  AUTO_CONFUSION_EXPLANATION_REQUEST:
    "AUTO_CONFUSION_EXPLANATION_REQUEST",
};

export const CONFUSION_TYPES = {
  TOO_FAST: "TOO_FAST",
  MISSED_TERM: "MISSED_TERM",
  LOST_THE_LOGIC: "LOST_THE_LOGIC",
  LOST_BIGGER_PICTURE: "LOST_BIGGER_PICTURE",
};

export function createTelemetryEvent(type, data = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: Date.now(),
    ...data,
  };
}