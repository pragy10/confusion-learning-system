const BACKEND_URL = "http://localhost:5000";

export async function saveTelemetryEvent(
  event,
  sessionId
) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,

          type: event.type,

          videoTime:
            event.videoTime ?? null,

          confusionType:
            event.confusionType ?? null,

          reason:
            event.reason ?? null,

          from:
            event.from ?? null,

          to:
            event.to ?? null,

          distance:
            event.distance ?? null,

          previousRate:
            event.previousRate ?? null,

          newRate:
            event.newRate ?? null,

          depth:
            event.depth ?? null,

          explanation:
            event.explanation ?? null,

          visualType:
            event.visualType ?? null,

          visualTitle:
            event.visualTitle ?? null,

          keyPoint:
            event.keyPoint ?? null,

          metadata:
            event.metadata ?? {},

          timestamp:
            event.timestamp,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Event save failed with status ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      "[TELEMETRY SAVE ERROR]",
      error
    );

    return null;
  }
}