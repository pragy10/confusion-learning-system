import { AI_SERVICE_URL } from "../config/api";

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

export async function generateFollowupExplanation({
  transcriptContext,
  originalExplanation,
  confusionType = "GENERAL",
  query = "",
  mode = "SIMPLIFY",
}) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/explain/followup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript_context: transcriptContext,
        original_explanation: originalExplanation,
        confusion_type: confusionType,
        query,
        mode,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("[FOLLOWUP_EXPLAIN_FALLBACK]", err);
  }

  // Graceful client fallback
  const modeLabels = {
    SIMPLIFY: "Simplified explanation",
    ANALOGY: "Everyday analogy",
    STEP_BY_STEP: "Step-by-step breakdown",
    DEEP_DIVE: "Technical deep-dive",
    CUSTOM: `Query: ${query}`,
  };

  return {
    explanation: `Clarification (${modeLabels[mode] || "Follow-up"}): Let's re-frame this concept from the ground up. In the video segment, the system is performing an action on incoming data before passing it along. Instead of tracking all moving parts at once, focus strictly on what changes from input to output.`,
    key_point: "Focus on the single transformation happening in this exact segment.",
    analogy_or_example: mode === "ANALOGY"
      ? "Think of it like an airport security checkpoint: luggage must be scanned (input processed) before passengers can proceed to the gate (next state)."
      : "",
    visual_type: "NONE",
    visual_title: "",
    visual: { nodes: [], relationships: [] },
  };
}

export async function generateSessionSummaryAI({
  events = [],
  confusionStats = {},
  customNotes = "",
  videoTitle = "",
}) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/session/summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        events,
        confusion_stats: confusionStats,
        custom_notes: customNotes,
        video_title: videoTitle,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("[SESSION_SUMMARY_FALLBACK]", err);
  }

  const count = confusionStats.totalConfusions || 0;
  const time = confusionStats.watchTimeFormatted || "several minutes";

  return {
    overview: `During this learning session (${time} active), you navigated complex material and actively diagnosed ${count} moment(s) of friction using contextual explanations.`,
    stumbling_blocks: count > 0 
      ? [`Moments with rapid conceptual transitions (${count} total confusion signals recorded).`]
      : ["No major friction moments recorded during this playback."],
    mastered_concepts: [
      "Core video workflow and terminology clarified through on-demand explanations.",
    ],
    recommended_review: [
      "Revisit sections where multiple rewinds or pauses were triggered to reinforce long-term retention.",
      "Check your timestamped personal notes for quick memory triggers.",
    ],
  };
}