import { useCallback, useRef, useState } from "react";
import {
  TELEMETRY_EVENTS,
  CONFUSION_TYPES,
  createTelemetryEvent,
} from "../utils/telemetry";

export function useVideoTelemetry() {
  const [events, setEvents] = useState([]);
  const previousTimeRef = useRef(0);
  const previousRateRef = useRef(1);

  const recordEvent = useCallback((type, data = {}) => {
    const event = createTelemetryEvent(type, data);

    setEvents((previousEvents) => [
      ...previousEvents,
      event,
    ]);

    console.log("[TELEMETRY]", event);

    return event;
  }, []);

  const recordPlay = useCallback((videoTime) => {
    return recordEvent(TELEMETRY_EVENTS.PLAY, {
      videoTime,
    });
  }, [recordEvent]);

  const recordPause = useCallback((videoTime) => {
    return recordEvent(TELEMETRY_EVENTS.PAUSE, {
      videoTime,
    });
  }, [recordEvent]);

  const recordSeek = useCallback((from, to) => {
    const difference = to - from;

    let type = TELEMETRY_EVENTS.SEEK;

    if (difference <= -2) {
      type = TELEMETRY_EVENTS.REWIND;
    } else if (difference >= 2) {
      type = TELEMETRY_EVENTS.FORWARD;
    }

    previousTimeRef.current = to;

    return recordEvent(type, {
      from,
      to,
      distance: Math.abs(difference),
    });
  }, [recordEvent]);

  const recordSpeedChange = useCallback((videoTime, newRate) => {
    const previousRate = previousRateRef.current;

    previousRateRef.current = newRate;

    return recordEvent(TELEMETRY_EVENTS.SPEED_CHANGE, {
      videoTime,
      previousRate,
      newRate,
    });
  }, [recordEvent]);

  const recordConfusionSignal = useCallback(
    (videoTime, confusionType) => {
        return recordEvent(TELEMETRY_EVENTS.CONFUSION_SIGNAL, {
        videoTime,
        confusionType,
        });
    },
    [recordEvent]
    );

  const updateCurrentTime = useCallback((currentTime) => {
    previousTimeRef.current = currentTime;
  }, []);

  const recordExplanationRequest = useCallback(
    (videoTime, reason) => {
      return recordEvent(
        TELEMETRY_EVENTS.AUTO_CONFUSION_EXPLANATION_REQUEST,
        {
          videoTime,
          reason,
        }
      );
    },
    [recordEvent]
  );

  return {
    events,
    recordPlay,
    recordPause,
    recordSeek,
    recordSpeedChange,
    recordConfusionSignal,
    recordExplanationRequest,
    updateCurrentTime,
  };
}