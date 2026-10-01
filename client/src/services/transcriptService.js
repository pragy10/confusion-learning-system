const AI_SERVICE_URL = "http://localhost:8000";

export async function transcribeVideo(videoFile) {
  const formData = new FormData();

  formData.append("file", videoFile);

  const response = await fetch(
    `${AI_SERVICE_URL}/transcribe`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        `Transcription failed with status ${response.status}`
    );
  }

  return response.json();
}