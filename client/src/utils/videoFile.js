export async function getVideoFile(videoUrl) {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(
      `Could not load video: ${response.status}`
    );
  }

  const blob = await response.blob();

  return new File(
    [blob],
    "sample.mp4",
    {
      type: blob.type || "video/mp4",
    }
  );
}