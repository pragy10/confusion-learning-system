const AI_SERVICE_URL = "http://localhost:8000";

const VISUAL_TYPE_MAPPING = {
  TOO_FAST: "SEQUENCE",
  MISSED_TERM: "NONE",
  LOST_THE_LOGIC: "CAUSE_EFFECT",
  LOST_BIGGER_PICTURE: "HIERARCHY",
};

export async function generateExplanation(
  transcriptContext,
  confusionType,
  depth = "STANDARD"
) {
  const response = await fetch(
    `${AI_SERVICE_URL}/explain`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript_context: transcriptContext,
        confusion_type: confusionType,
        depth,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        `Explanation request failed with status ${response.status}`
    );
  }

  const result = await response.json();
  
  if (result && VISUAL_TYPE_MAPPING[confusionType]) {
    result.visual_type = VISUAL_TYPE_MAPPING[confusionType];
  }
  
  return result;
}