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
  "mermaid_diagram": "string (the raw mermaid code. Always wrap node labels in double quotes like A[\"Label text\"] to avoid syntax errors)"
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
                return result

            last_error = f"{response.status_code} {response.text}"
        except Exception as error:
            last_error = str(error)

    raise RuntimeError(f"All configured OpenRouter models failed. Last error: {last_error}")