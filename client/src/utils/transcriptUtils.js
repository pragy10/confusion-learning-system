export function getTranscriptSegmentAtTime(
  transcript,
  videoTime
) {
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
  const currentIndex = transcript.findIndex(
    (segment) =>
      videoTime >= segment.start &&
      videoTime < segment.end
  );

  if (currentIndex === -1) {
    return {
      current: null,
      previous: [],
      next: [],
    };
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