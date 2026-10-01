import os
import json

from dotenv import load_dotenv
from openrouter import OpenRouter


load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "OPENROUTER_API_KEY is not configured."
    )


client = OpenRouter(
    api_key=API_KEY
)


# Models are tried in this order.
MODEL_FALLBACKS = [
    "deepseek/deepseek-chat",
    "qwen/qwen3-235b-a22b",
]


def generate_explanation(
    transcript_context: str,
    confusion_type: str,
):
    prompt = f"""
You are an educational explanation assistant
inside an interactive video-learning system.

A learner has indicated that they are confused
about a specific part of a lecture.

Confusion type:
{confusion_type}

Relevant transcript:
{transcript_context}

Your job is to explain the concept clearly and
create a simple visual representation that helps
the learner understand the concept.

IMPORTANT RULES:

1. Only use information supported by the transcript.
2. Do not invent technical details.
3. Keep the explanation concise.
4. Prefer a visual representation whenever possible.
5. The visual should directly address the confusion type.
6. Use simple node names.
7. Relationships should explain how concepts connect.
8. Return ONLY valid JSON.
9. Do not use markdown.
10. Do not wrap the JSON in ```json blocks.

Choose visual_type from:

NONE
SEQUENCE
CAUSE_EFFECT
HIERARCHY
COMPARISON

Guidelines:

TOO_FAST:
Use SEQUENCE when the transcript describes a process.

MISSED_TERM:
Use NONE unless the transcript provides enough
context to explain the term.

LOST_THE_LOGIC:
Prefer SEQUENCE or CAUSE_EFFECT.

LOST_THE_BIGGER_PICTURE:
Prefer HIERARCHY or COMPARISON.

Return exactly this JSON structure:

{{
    "explanation": "Short explanation for the learner.",
    "confusion_type": "{confusion_type}",
    "visual_type": "SEQUENCE",
    "visual_title": "Short title for the visual",
    "visual": {{
        "nodes": [
            "Node 1",
            "Node 2",
            "Node 3"
        ],
        "relationships": [
            {{
                "from": "Node 1",
                "to": "Node 2",
                "label": "relationship"
            }},
            {{
                "from": "Node 2",
                "to": "Node 3",
                "label": "relationship"
            }}
        ]
    }},
    "key_point": "The single most important thing the learner should remember."
}}
"""

    response = client.chat.send(
        models=MODEL_FALLBACKS,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    raw_content = response.choices[0].message.content

    try:
        result = json.loads(raw_content)

    except json.JSONDecodeError as error:
        raise RuntimeError(
            f"LLM returned invalid JSON: {error}\n"
            f"Raw response:\n{raw_content}"
        )

    return result