export function getTranscriptSegmentAtTime(
  transcript,
  videoTime
) {
  if (!transcript || transcript.length === 0) return null;
  return (
    transcript.find(
      (segment) =>
        videoTime >= segment.start &&
        videoTime < segment.end
    ) || null
  );
}

export function getTranscriptContext(
  transcript,
  videoTime,
  surroundingSegments = 1
) {
  if (!transcript || transcript.length === 0) {
    return {
      current: null,
      previous: [],
      next: [],
    };
  }

  // 1. Direct match: videoTime is inside [start, end)
  let currentIndex = transcript.findIndex(
    (segment) =>
      videoTime >= segment.start &&
      videoTime < segment.end
  );

  // 2. If between sentences, before start, or after end
  if (currentIndex === -1) {
    if (videoTime < transcript[0].start) {
      currentIndex = 0;
    } else {
      // Find the last segment that started before videoTime
      for (let i = transcript.length - 1; i >= 0; i--) {
        if (videoTime >= transcript[i].start) {
          currentIndex = i;
          break;
        }
      }
    }
  }

  if (currentIndex === -1) {
    currentIndex = 0;
  }

  return {
    current: transcript[currentIndex],
    previous: transcript.slice(
      Math.max(0, currentIndex - surroundingSegments),
      currentIndex
    ),
    next: transcript.slice(
      currentIndex + 1,
      currentIndex + 1 + surroundingSegments
    ),
  };
}
