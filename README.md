# HCI Confusion Learning System

## An Interaction Design Framework for Real-time Confusion Signalling in Video-based Learning

An HCI-focused video learning system that detects and captures learner confusion during video lectures and provides contextual, adaptive explanations.

The system is designed around the interaction:

**Watch → Detect/Signal Confusion → Identify Confusion Type → Understand → Resume**

Instead of relying only on:

**Pause → Rewind → Rewatch**

the system allows learners to explicitly communicate *why* they are confused and uses video context, telemetry, speech transcription, and an LLM to generate appropriate explanations.

---

# 1. Project Goals

The system aims to provide:

* Manual confusion signalling
* Automatic confusion detection from playback behaviour
* Confusion-type classification
* Timestamp-aware explanations
* Real video transcription
* LLM-generated explanations
* Diagram-oriented explanations
* Explanation depth control
* Peer confusion visualization
* Reduced context switching while learning

---

# 2. Current Architecture

```text
                         VIDEO INPUT
                    ┌──────────────────┐
                    │ MP4 / MOV / MKV  │
                    │ WebM / other     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     FFmpeg       │
                    │ Audio Extraction │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     Whisper      │
                    │ Speech-to-Text   │
                    └────────┬─────────┘
                             │
                             ▼
                    Timestamped Transcript
                             │
                             ▼
┌─────────────────────────────────────────────────────┐
│                 React Client                       │
│                                                     │
│  Video Player                                      │
│  ├── Playback Controls                             │
│  ├── Telemetry                                     │
│  ├── Radial Confusion Menu                         │
│  ├── Automatic Confusion Prompt                    │
│  └── Explanation UI                                │
│                                                     │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
                 FastAPI AI Service
                         │
                         ▼
                    Gemini LLM
                         │
                         ▼
              Structured Explanation
                         │
                         ▼
                Visual Explanation
```

---

# 3. Technology Stack

## Frontend

* React
* Vite
* Tailwind CSS v3
* JavaScript
* HTML5 Video API

## Backend / Application

* Node.js
* Express.js
* MongoDB / MongoDB-compatible storage

## AI Service

* Python 3.12
* FastAPI
* Uvicorn
* OpenAI Whisper
* FFmpeg
* Google Gemini API

## Development

* VS Code
* PowerShell
* Git

---

# 4. Project Structure

The project root is:

```text
D:\hci
```

Current structure:

```text
hci/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoPlayer/
│   │   │   ├── VideoControls/
│   │   │   ├── RadialMenu/
│   │   │   └── ConfusionPrompt/
│   │   │
│   │   ├── hooks/
│   │   │   └── useVideoTelemetry.js
│   │   │
│   │   ├── utils/
│   │   │   └── confusionDetector.js
│   │   │
│   │   └── ...
│   │
│   ├── public/
│   │   └── videos/
│   │       └── sample.mp4
│   │
│   └── package.json
│
├── server/
│   ├── ...
│   └── package.json
│
├── ai-service/
│   ├── .venv/
│   ├── main.py
│   ├── transcription.py
│   ├── gemini_service.py
│   ├── .env
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

The exact contents may grow as additional project phases are implemented.

---

# 5. Prerequisites

Make sure the following are installed.

Check them with:

```powershell
node --version
npm --version
python --version
git --version
mongosh --version
ffmpeg -version
```

Current development environment:

```text
Node.js:  v25.2.1
npm:      11.6.2
Python:   3.12.3
Git:      2.45.2
mongosh:  2.5.2
Whisper:  20250625
FFmpeg:   9.0.2
```

---

# 6. FFmpeg

FFmpeg is required for extracting audio from uploaded videos before Whisper transcription.

Verify:

```powershell
ffmpeg -version
```

If Windows cannot find FFmpeg, add its `bin` directory to the user PATH.

Example installation location:

```text
C:\Users\<username>\AppData\Local\Microsoft\WinGet\Packages\
Gyan.FFmpeg.Shared_Microsoft.Winget.Source_8wekyb3d8bbwe\
ffmpeg-9.0.2-full_build-shared\bin
```

After modifying PATH, restart PowerShell.

Then:

```powershell
ffmpeg -version
```

must work.

---

# 7. Python AI Service Setup

Open PowerShell.

```powershell
cd D:\hci\ai-service
```

Create the virtual environment if it does not already exist:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

The terminal should now show:

```text
(.venv) PS D:\hci\ai-service>
```

---

# 8. Install AI Dependencies

Install the required packages:

```powershell
pip install fastapi uvicorn python-multipart python-dotenv openai-whisper google-genai
```

Verify Whisper:

```powershell
python -c "import whisper; print('Whisper:', whisper.__version__)"
```

Expected:

```text
Whisper: 20250625
```

---

# 9. Gemini API Configuration

Create:

```text
D:\hci\ai-service\.env
```

Add:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Replace:

```text
YOUR_GEMINI_API_KEY
```

with your actual Gemini API key.

Never commit this file to Git.

Your `.gitignore` should contain:

```text
.env
.venv/
__pycache__/
*.pyc
```

---

# 10. Start the AI Service

Activate the virtual environment:

```powershell
cd D:\hci\ai-service
.\.venv\Scripts\Activate.ps1
```

Start FastAPI:

```powershell
uvicorn main:app --reload --port 8000
```

Expected:

```text
Uvicorn running on http://127.0.0.1:8000
```

---

# 11. Test AI Service Health

Open:

```text
http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "ai-service"
}
```

You can also use:

```powershell
curl http://localhost:8000/health
```

---

# 12. FastAPI Swagger UI

FastAPI automatically provides an interactive API interface.

Open:

```text
http://localhost:8000/docs
```

Available endpoints currently include:

```text
GET  /health
POST /transcribe
POST /explain
```

---

# 13. Test Video Transcription

Place a test video inside:

```text
D:\hci\ai-service
```

For example:

```text
sample.mp4
```

Make sure FFmpeg works:

```powershell
ffmpeg -version
```

Then open:

```text
http://localhost:8000/docs
```

Find:

```text
POST /transcribe
```

Click:

```text
Try it out
```

Upload:

```text
sample.mp4
```

Click:

```text
Execute
```

Expected response:

```json
{
  "text": "...",
  "segments": [
    {
      "id": 1,
      "start": 0,
      "end": 10.5,
      "text": "..."
    }
  ]
}
```

Each segment contains:

```text
id
start
end
text
```

These timestamps are important because later the system needs to identify the transcript surrounding the exact moment of confusion.

---

# 14. Testing Transcription with cURL

PowerShell:

```powershell
curl -X POST `
  "http://localhost:8000/transcribe" `
  -H "accept: */*" `
  -H "Content-Type: multipart/form-data" `
  -F "file=@sample.mp4;type=video/mp4"
```

A successful response should contain:

```json
{
  "text": "...",
  "segments": [...]
}
```

---

# 15. Gemini Model Test

The project uses Gemini for explanation generation.

Before testing the explanation endpoint, verify which models are available to your API key:

```powershell
python -c "from google import genai; import os; from dotenv import load_dotenv; load_dotenv(); client=genai.Client(api_key=os.getenv('GEMINI_API_KEY')); print('\n'.join(m.name for m in client.models.list()))"
```

Use a model that is actually available to your account.

Do not assume that every Gemini model is available to every API account.

---

# 16. Gemini Explanation Architecture

The final explanation system is designed to be diagram-first.

The LLM should not simply return a large paragraph.

Instead:

```text
Transcript Context
       +
Confusion Type
       │
       ▼
     Gemini
       │
       ▼
Structured Explanation
       │
       ├── Explanation
       ├── Visual Type
       ├── Visual Title
       ├── Nodes
       ├── Relationships
       └── Key Point
```

Example:

```json
{
  "explanation": "The system first receives the user's request and then converts it into SQL.",
  "visual_type": "SEQUENCE",
  "visual_title": "How the request is processed",
  "visual": {
    "nodes": [
      "User Request",
      "SQL Generation",
      "Query Execution",
      "Report Generation"
    ],
    "relationships": [
      {
        "from": "User Request",
        "to": "SQL Generation",
        "label": ""
      },
      {
        "from": "SQL Generation",
        "to": "Query Execution",
        "label": ""
      },
      {
        "from": "Query Execution",
        "to": "Report Generation",
        "label": ""
      }
    ]
  },
  "key_point": "Each stage passes its output to the next stage."
}
```

React will render the diagram instead of displaying the raw JSON.

---

# 17. Confusion Types

The system currently uses four primary confusion categories.

## 1. Too Fast

The learner understands the topic generally but needs a quicker recap.

Preferred output:

```text
Short recap
+
optional sequence
```

---

## 2. Missed a Term

The learner does not understand a specific word or technical term.

Preferred output:

```text
Term
   ↓
Simple Definition
   ↓
Context in Lecture
```

---

## 3. Lost the Logic

The learner understands the individual pieces but not how they connect.

Preferred visual:

```text
A
↓
B
↓
C
↓
D
```

or:

```text
Condition
    ↓
Decision
    ↓
Result
```

---

## 4. Lost the Bigger Picture

The learner needs the overall conceptual structure.

Preferred visuals:

```text
             Main Concept
             /          \
        Concept A      Concept B
          /                \
      Detail A          Detail B
```

or:

```text
Concept A  ↔  Concept B
      \          /
       \        /
       Main Idea
```

---

# 18. Current Manual Confusion Interaction

The learner can manually trigger the confusion menu.

Current interaction:

```text
Video
  │
  ▼
Confusion Button
  │
  ▼
Radial Menu
  │
  ├── Too Fast
  ├── Missed a Term
  ├── Lost the Logic
  └── Lost the Bigger Picture
```

The selected confusion type is recorded in telemetry.

---

# 19. Telemetry

The system records learner interaction events.

Examples:

```text
PLAY
PAUSE
SEEK
SPEED_CHANGE
CONFUSION_SIGNAL
```

Telemetry is currently displayed in the development UI.

Example:

```json
{
  "type": "CONFUSION_SIGNAL",
  "timestamp": 124.5,
  "confusionType": "LOST_THE_LOGIC"
}
```

Telemetry will later be used by the automatic confusion detector.

---

# 20. Automatic Confusion Detection

The system monitors passive behavioural signals such as:

* Frequent rewinds
* Repeated pause/play actions
* Playback speed reductions
* Short navigation patterns

Current cooldown:

```text
5 seconds
```

The cooldown prevents the system from repeatedly interrupting the learner.

The intended interaction is:

```text
Learner behaviour
       ↓
Telemetry
       ↓
Confusion Detector
       ↓
Potential confusion
       ↓
Subtle prompt
       ↓
Learner decides whether to request help
```

---

# 21. Development Workflow

The project is being implemented phase-by-phase.

Do not implement all modules simultaneously.

For each phase:

```text
Implement
   ↓
Run
   ↓
Test
   ↓
Fix errors
   ↓
Confirm working
   ↓
Move to next phase
```

---

# 22. Planned Development Phases

## Phase 1 — Project Foundation

Completed:

* React/Vite setup
* Tailwind CSS v3
* Basic application layout
* Dark HCI-oriented interface
* Initial project structure

---

## Phase 2 — Video Player + Telemetry

Completed:

* HTML5 video player
* Custom controls
* Play/pause tracking
* Seek tracking
* Playback speed tracking
* Current playback time

---

## Phase 3 — Manual Confusion Signalling

Completed:

* Radial confusion menu
* Four confusion types
* Confusion event logging
* Manual confusion interaction

---

## Phase 4 — Automatic Confusion Detection

Completed:

* Passive playback telemetry
* Rewind detection
* Pause/play pattern detection
* Speed-change detection
* Automatic confusion prompt
* 5-second cooldown

---

## Phase 4B — Real Video Transcription

Completed:

```text
Video
 ↓
FFmpeg
 ↓
Whisper
 ↓
Timestamped transcript
```

The system no longer depends entirely on a hardcoded transcript.

---

## Phase 5 — Gemini Explanation Engine

Current phase.

Goals:

* Gemini API integration
* Transcript context extraction
* Confusion-aware prompts
* Structured explanation output
* Diagram-oriented response generation

---

## Phase 6 — Visual Explanation Renderer

Planned:

* Sequence diagrams
* Cause-effect diagrams
* Hierarchy diagrams
* Comparison structures
* Interactive React rendering

Possible implementation:

```text
React
+
React Flow / custom SVG
```

---

## Phase 7 — Explanation Depth Slider

Planned levels:

```text
1. Brief
2. Standard
3. Deep Dive
```

Example:

```text
Brief
A → B → C

Standard
A → B → C
    ↓
    Why?

Deep
A → B → C
    ↓
Detailed reasoning
    ↓
Supporting concepts
```

---

## Phase 8 — Context-Aware Transcript Retrieval

Instead of sending the entire transcript to Gemini:

```text
Current timestamp
      ↓
Find relevant segment
      ↓
Previous segment
      ↓
Current segment
      ↓
Next segment
      ↓
Gemini
```

This reduces unnecessary input and improves contextual relevance.

---

## Phase 9 — Peer Confusion Heatmap

Planned:

```text
Video timeline

0:00 ──────── 2:00 ──────── 4:00 ──────── 6:00
              ███
                         ██████
                                  ██
```

Important HCI constraint:

The learner should not see future confusion points before completing that portion of the video.

---

## Phase 10 — Integration + Evaluation

Planned:

* End-to-end testing
* Interaction testing
* API testing
* Telemetry testing
* Explanation relevance testing
* UI usability testing
* Performance improvements
* Final HCI evaluation

---

# 23. Starting the Entire Project

### One-Click Startup (Recommended)

From the project root (D:\hci), simply double-click start.bat or run:

`cmd
start.bat
`

Or using PowerShell:

`powershell
.\start.ps1
`

This automatically opens 3 dedicated windows for:
1. **Node/Express Backend Server** (http://localhost:5000)
2. **FastAPI AI Microservice** with .venv active (http://localhost:8000)
3. **React Vite Client** (http://localhost:5173)

To stop all services and free the ports, run stop.bat.

---

### Manual Multi-Terminal Startup (Alternative)

The project uses multiple services.

Open separate VS Code terminals.

---

## Terminal 1 — React Client

```powershell
cd D:\hci\client
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

Usually:

```text
http://localhost:5173
```

---

## Terminal 2 — AI Service

```powershell
cd D:\hci\ai-service
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

AI service:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

---

## Terminal 3 — Node/Express Server

```powershell
cd D:\hci\server
npm install
npm run dev
```

The exact port depends on the Express configuration.

---

# 24. Quick Startup Checklist

Every time you work on the project:

```text
[ ] Open VS Code
[ ] Open D:\hci
[ ] Start React client
[ ] Start FastAPI AI service
[ ] Make sure FFmpeg works
[ ] Make sure .env contains Gemini API key
[ ] Open React application
[ ] Test video playback
[ ] Test confusion signalling
[ ] Test telemetry
[ ] Test transcription when required
[ ] Test Gemini when required
```

---

# 25. Troubleshooting

## FFmpeg not found

Run:

```powershell
ffmpeg -version
```

If it fails, verify FFmpeg is installed and its `bin` directory is in PATH.

Restart PowerShell after changing PATH.

---

## Whisper import error

Activate the virtual environment:

```powershell
cd D:\hci\ai-service
.\.venv\Scripts\Activate.ps1
```

Then:

```powershell
pip install openai-whisper
```

Test:

```powershell
python -c "import whisper; print(whisper.__version__)"
```

---

## FastAPI cannot find a module

Make sure you are inside:

```text
D:\hci\ai-service
```

Then run:

```powershell
uvicorn main:app --reload --port 8000
```

Do not run:

```powershell
uvicorn ai-service.main:app
```

from the project root because `ai-service` contains a hyphen and is not a valid normal Python package name.

---

## Gemini API error: 404

A model may not be available to your API account.

Check available models:

```powershell
python -c "from google import genai; import os; from dotenv import load_dotenv; load_dotenv(); client=genai.Client(api_key=os.getenv('GEMINI_API_KEY')); print('\n'.join(m.name for m in client.models.list()))"
```

Use an available model.

---

## Gemini API error: 503

Example:

```text
503 UNAVAILABLE
This model is currently experiencing high demand.
```

This means the request reached Gemini but the model is temporarily unavailable because of demand.

It is not necessarily a problem with your application.

Try another available model or retry later.

The application should eventually implement fallback/retry handling rather than assuming one model is always available.

---

## React import error

Check that the referenced file actually exists.

For example:

```text
src/components/RadialMenu/RadialMenu.jsx
```

must match the import path:

```javascript
import RadialMenu from "../RadialMenu/RadialMenu";
```

---

# 26. Important Security Rules

Never commit:

```text
.env
```

Never put the Gemini API key inside:

```text
client/src/
```

The correct architecture is:

```text
React
  ↓
Your backend / AI service
  ↓
Gemini API
```

Not:

```text
React
  ↓
Gemini API
```

with the API key exposed to the browser.

---

# 27. Project Completion Target

The target is **approximately 70% functional implementation**, rather than a completely production-ready system.

The minimum target is:

```text
✓ Video playback
✓ Learner telemetry
✓ Manual confusion signalling
✓ Automatic behavioural detection
✓ Real video transcription
✓ Timestamp alignment
✓ Gemini explanations
✓ Confusion-aware explanations
✓ Diagram-oriented explanations
✓ Interactive visual renderer
✓ Explanation depth control
✓ Basic peer confusion visualization
✓ End-to-end integration
```

Advanced production features can remain outside the scope if the core HCI framework is functional and demonstrable.

---

# 28. Core Design Principle

The system should not behave like:

```text
Learner is confused
       ↓
LLM generates paragraph
```

Instead:

```text
Learner becomes confused
       ↓
System identifies context
       ↓
Learner identifies confusion type
       ↓
System selects appropriate representation
       ↓
Gemini generates structured explanation
       ↓
React renders visual explanation
       ↓
Learner adjusts explanation depth
       ↓
Learner resumes video
```

The central HCI principle is:

> **Different types of confusion should receive different forms of explanation.**

This principle drives the architecture, interaction design, and AI explanation engine.
