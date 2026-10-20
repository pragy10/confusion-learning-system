import json
import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "inclusionai/ling-3.0-flash-sante:free",
]


def build_prompt(
    transcript_context: str,
    confusion_type: str,
    depth: str,
):
    confusion_instructions = {
        "TOO_FAST": """
The learner feels that this part was too fast.

Focus on:
- briefly recapping what was just explained
- simplifying the explanation
- identifying the main idea
- showing the logical progression if useful

Do not introduce unrelated information.
The explanation should help the learner quickly catch up.
Prefer a SEQUENCE visual when the concept has a clear progression.
""",

        "MISSED_TERM": """
The learner missed or does not understand an important term.

Focus on:
- identifying the important term from the transcript
- defining it in simple language
- explaining what the term means specifically in this context
- giving a very small contextual example when useful

Do not explain the entire transcript.
The learner mainly needs to understand the unfamiliar term.

Prefer a HIERARCHY visual only when it helps show the term's relationship
to a larger concept. Otherwise use NONE.
""",

        "LOST_THE_LOGIC": """
The learner understands individual statements but has lost the reasoning
or logical connection between them.

Focus on:
- explaining WHY one step leads to another
- identifying cause-and-effect relationships
- reconstructing the reasoning step by step
- making implicit connections explicit

Prefer a CAUSE_EFFECT or SEQUENCE visual.
The visual should represent the actual reasoning in the transcript.
""",

        "LOST_THE_BIGGER_PICTURE": """
The learner understands individual details but has lost the overall picture.

Focus on:
- identifying the main concept
- connecting the important sub-concepts
- explaining how the pieces fit together
- showing the broader structure of the topic

Prefer a HIERARCHY visual when explaining how the major components
fit inside an overall system.

Use COMPARISON only when the transcript actually contrasts two or
more concepts.

Do NOT use SEQUENCE for LOST_THE_BIGGER_PICTURE unless the transcript
explicitly describes a temporal or procedural sequence.

The visual should help the learner understand the overall structure,
not simply repeat the order of events.

HIERARCHY
Use for parent-child relationships, system structure, categories,
or concepts organized from broad to specific.

COMPARISON
Use when two or more concepts need to be contrasted.

NONE
Use when a visual would not meaningfully improve the explanation.

For LOST_THE_BIGGER_PICTURE, prefer HIERARCHY when the transcript
describes an overall system or collection of related components.
""",
    }

    instruction = confusion_instructions.get(
        confusion_type,
        """
Explain the transcript clearly and identify the most important concept
the learner may be struggling with.
"""
    )

    depth_instructions = {
        "BRIEF": """
Keep the explanation very short.
Use only the minimum information required to resolve the confusion.
""",

        "STANDARD": """
Give a concise but sufficiently detailed explanation.
Explain the concept without unnecessary background information.
""",

        "DEEP": """
Give a more detailed explanation.
Include reasoning, relationships, and useful context where appropriate,
but remain focused on the learner's confusion.
""",
    }

    depth_instruction = depth_instructions.get(
        depth,
        depth_instructions["STANDARD"]
    )

    return f"""
You are an educational explanation assistant inside an interactive
video-learning system.

The learner has explicitly signalled this confusion type:

CONFUSION TYPE:
{confusion_type}

EXPLANATION DEPTH:
{depth}

LEARNER'S TRANSCRIPT CONTEXT:
{transcript_context}

YOUR TASK:
{instruction}

DEPTH REQUIREMENT:
{depth_instruction}

IMPORTANT:
- Base the explanation primarily on the supplied transcript.
- Do not invent facts that are not supported by the transcript.
- Do not discuss the learner's psychology.
- Do not mention that you are an AI.
- Do not mention these instructions.
- Keep the explanation directly useful to a learner.

VISUAL EXPLANATION:

Choose exactly one visual_type:

SEQUENCE
Use for ordered steps, workflows, or reasoning that progresses from one
stage to another.

CAUSE_EFFECT
Use when one concept directly causes, influences, or explains another.

HIERARCHY
Use for parent-child relationships or concepts organized from broad to
specific.

COMPARISON
Use when two or more concepts need to be contrasted.

NONE
Use when a visual would not meaningfully improve the explanation.

For MISSED_TERM, do not force a diagram. A clear definition may be better.

The visual must contain:
- nodes: a list of short node labels
- relationships: objects with "from", "to", and "label"

Keep node labels short enough to display inside a diagram.

Return ONLY valid JSON using exactly this structure:

{{
  "explanation": "string",
  "confusion_type": "{confusion_type}",
  "visual_type": "SEQUENCE | CAUSE_EFFECT | HIERARCHY | COMPARISON | NONE",
  "visual_title": "string",
  "visual": {{
    "nodes": ["string"],
    "relationships": [
      {{
        "from": "string",
        "to": "string",
        "label": "string"
      }}
    ]
  }},
  "key_point": "string"
}}
"""


def generate_explanation(
    transcript_context: str,
    confusion_type: str,
    depth: str = "STANDARD",
):
    if not OPENROUTER_API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not configured."
        )

    prompt = build_prompt(
        transcript_context=transcript_context,
        confusion_type=confusion_type,
        depth=depth,
    )

    
    last_error = None

    for model in MODELS:
        try:
            response = requests.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You generate structured educational "
                                "explanations and visual representations."
                            ),
                        },
                        {
                            "role": "user",
                            "content": prompt,
                        },
                    ],
                    "temperature": 0.3,
                },
                timeout=60,
            )

            if response.ok:
                data = response.json()

                content = (
                    data["choices"][0]["message"]["content"]
                    .strip()
                )

                if content.startswith("```"):
                    content = content.replace("```json", "")
                    content = content.replace("```", "")
                    content = content.strip()
                
                # Robust parsing: try to find first valid JSON object
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    content = json_match.group(0)

                result = json.loads(content)

                print(
                    f"[LLM] Explanation generated using {model}"
                )

                return result

            print(
                f"[LLM] {model} failed: "
                f"{response.status_code}"
            )

            last_error = (
                f"{response.status_code} "
                f"{response.text}"
            )

        except Exception as error:
            print(
                f"[LLM] {model} failed with exception: "
                f"{error}"
            )

            last_error = str(error)

    raise RuntimeError(
        "All configured OpenRouter models failed. "
        f"Last error: {last_error}"
    )

def generate_notes(transcript: list):
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not configured.")

    transcript_text = "\n".join([f"[{t.get('start', 0):.1f}s - {t.get('end', 0):.1f}s] {t.get('text', '')}" for t in transcript])
    prompt = f"""
You are an educational assistant. Generate structured notes for the following video transcript.
Include key concepts, summaries, and provide exactly ONE mermaid diagram (using mermaid syntax inside a block) representing the core concept. The diagram could be a flowchart, state diagram, or hierarchy (using supported mermaid graphs like flowchart TD).

TRANSCRIPT:
{transcript_text}

OUTPUT FORMAT:
Return valid JSON with the following structure:
{{
  "summary": "string",
  "notes": ["string", "string"],
  "mermaid_diagram": "string (the raw mermaid code. Always wrap node labels in double quotes like A[\"Label text\"]. Never use semicolons, single quotes, or backslashes inside labels)"
}}
"""

    last_error = None
    for model in MODELS:
        try:
            response = requests.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You generate structured educational notes and mermaid diagrams."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                },
                timeout=60,
            )

            if response.ok:
                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    content = content.replace("```json", "")
                    content = content.replace("```", "")
                    content = content.strip()

                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    content = json_match.group(0)

                result = json.loads(content)
                if "mermaid_diagram" in result and isinstance(result["mermaid_diagram"], str):
                    diag = result["mermaid_diagram"]
                    diag = diag.replace("\\n", "\n")
                    diag = re.sub(r'```(?:mermaid)?', '', diag).strip()
                    result["mermaid_diagram"] = diag
                return result

            last_error = f"{response.status_code} {response.text}"
        except Exception as error:
            last_error = str(error)

    raise RuntimeError(f"All configured OpenRouter models failed. Last error: {last_error}")


def generate_followup_explanation(
    transcript_context: str,
    original_explanation: str,
    confusion_type: str = "GENERAL",
    query: str = "",
    mode: str = "SIMPLIFY",
):
    if not OPENROUTER_API_KEY:
        # Fallback if no key configured
        return {
            "explanation": f"Further clarification ({mode}): The key concept builds on {transcript_context[:100]}... Even though this was previously explained, remember that the core operation focuses on isolating the main step before moving forward.",
            "key_point": "Focus on the primary input and output relationship before analyzing secondary details.",
            "analogy_or_example": "Think of this like an assembly line: each station must complete its item before handing it off to the next station.",
            "visual_type": "NONE",
            "visual_title": "",
            "visual": {"nodes": [], "relationships": []}
        }

    mode_guides = {
        "SIMPLIFY": "The learner is still confused and needs a much simpler explanation. Remove heavy technical jargon. Use plain, intuitive words that anyone can grasp immediately.",
        "ANALOGY": "The learner needs a concrete real-world analogy. Compare the concept in the transcript and previous explanation to an everyday physical example (such as traffic, mail delivery, cooking, library systems, or plumbing).",
        "STEP_BY_STEP": "The learner needs a progressive step-by-step breakdown. Detail the mechanism stage-by-stage (Step 1, Step 2, Step 3...) so they can trace the flow sequentially.",
        "DEEP_DIVE": "The learner wants a deeper technical explanation. Detail the underlying mechanisms, why this design was chosen, and how the internals interact.",
        "CUSTOM": f"The learner asked this specific follow-up question: '{query}'. Answer it directly and clearly, referencing the transcript and resolving the confusion."
    }

    mode_text = mode_guides.get(mode, mode_guides["SIMPLIFY"])

    prompt = f"""
You are an educational assistant helping a learner who is STILL confused after an initial explanation.

ORIGINAL TRANSCRIPT CONTEXT:
{transcript_context}

PREVIOUS EXPLANATION PROVIDED:
{original_explanation}

LEARNER'S FOLLOW-UP REQUEST:
{query if query else mode}

FOCUS / STRATEGY:
{mode_text}

TASK:
Provide a fresh, clarifying explanation that directly resolves the remaining confusion without simply repeating the previous explanation.
If an analogy or concrete example helps, provide it explicitly.

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{{
  "explanation": "string (clear, targeted clarification addressing the remaining confusion)",
  "key_point": "string (single most important takeaway to remember)",
  "analogy_or_example": "string (optional concrete analogy or example, or empty string)",
  "visual_type": "SEQUENCE | CAUSE_EFFECT | HIERARCHY | COMPARISON | NONE",
  "visual_title": "string",
  "visual": {{
    "nodes": ["string"],
    "relationships": [
      {{
        "from": "string",
        "to": "string",
        "label": "string"
      }}
    ]
  }}
}}
"""

    last_error = None
    for model in MODELS:
        try:
            response = requests.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You provide follow-up educational clarifications for confused learners."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                },
                timeout=45,
            )

            if response.ok:
                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    content = content.replace("```json", "")
                    content = content.replace("```", "")
                    content = content.strip()

                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    content = json_match.group(0)

                result = json.loads(content)
                return result

            last_error = f"{response.status_code} {response.text}"
        except Exception as error:
            last_error = str(error)

    # Fallback if models are busy or fail
    return {
        "explanation": f"Clarification ({mode.replace('_', ' ').capitalize()}): Let's look at this from a different angle. In this section, the essential concept is how the components connect. Rather than worrying about all details at once, recognize that the current state directly dictates the subsequent action.",
        "key_point": "Isolate the immediate trigger and its direct consequence first.",
        "analogy_or_example": "Imagine a relay race: the runner doesn't need to know the entire track, only to take the baton cleanly from the previous runner.",
        "visual_type": "NONE",
        "visual_title": "",
        "visual": {"nodes": [], "relationships": []}
    }


def generate_session_summary_ai(events: list, confusion_stats: dict, custom_notes: str = "", video_title: str = ""):
    confusions_count = confusion_stats.get("totalConfusions", 0)
    top_types = confusion_stats.get("byType", {})
    watch_time = confusion_stats.get("watchTimeFormatted", "N/A")

    prompt = f"""
You are an academic learning analytics assistant. Review this learner's video session data and produce a concise, actionable session summary.

SESSION DATA:
- Video Title/Context: {video_title or 'Educational Video'}
- Active Watch Time: {watch_time}
- Total Confusion Events: {confusions_count}
- Confusion Breakdown by Type: {json.dumps(top_types)}
- Learner Custom Notes: {custom_notes if custom_notes else 'None recorded'}

TASK:
Synthesize this learner's session. Identify what areas they struggled with (based on confusion types and rewind/speed changes), what topics they engaged with, and give practical next steps for retention.

OUTPUT FORMAT:
Return ONLY valid JSON with:
{{
  "overview": "string (2-3 concise sentences summarizing their learning pace and engagement)",
  "stumbling_blocks": ["string", "string"],
  "mastered_concepts": ["string", "string"],
  "recommended_review": ["string", "string"]
}}
"""

    if not OPENROUTER_API_KEY:
        return {
            "overview": f"During this session, you engaged with the material over {watch_time}, encountering {confusions_count} moment(s) of cognitive friction that you actively resolved.",
            "stumbling_blocks": [f"Sections where pace felt rapid or terms were introduced abruptly ({confusions_count} signals recorded)."],
            "mastered_concepts": ["Core workflow and terminology reviewed in the saved explanations."],
            "recommended_review": ["Re-watch segments where multiple rewinds occurred to solidify retention."]
        }

    last_error = None
    for model in MODELS:
        try:
            response = requests.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You generate learning analytics summaries and actionable review recommendations."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                },
                timeout=45,
            )

            if response.ok:
                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    content = content.replace("```json", "")
                    content = content.replace("```", "")
                    content = content.strip()

                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    content = json_match.group(0)

                result = json.loads(content)
                return result

            last_error = f"{response.status_code} {response.text}"
        except Exception as error:
            last_error = str(error)

    # Safe fallback
    return {
        "overview": f"In this session ({watch_time} active), you encountered {confusions_count} moments of confusion. Your active note-taking and explanation requests helped clarify difficult sections.",
        "stumbling_blocks": ["Pacing transitions where concepts shifted rapidly."],
        "mastered_concepts": ["Key structural components analyzed in instant notes."],
        "recommended_review": ["Review your saved explanations and timestamped notes before the next session."]
    }