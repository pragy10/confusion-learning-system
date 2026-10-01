from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
from pydantic import BaseModel
from llm_explanation import generate_explanation
from transcription import transcribe_video
import json


app = FastAPI(
    title="Confusion Learning AI Service",
    version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExplanationRequest(BaseModel):
    transcript_context: str
    confusion_type: str
    
    
@app.post("/explain")
def explain(request: ExplanationRequest):
    try:
        result = generate_explanation(
            transcript_context=request.transcript_context,
            confusion_type=request.confusion_type,
        )

        return result

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-service"
    }


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided."
        )

    suffix = os.path.splitext(file.filename)[1]

    if suffix.lower() not in [".mp4", ".mov", ".mkv", ".webm"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format."
        )

    temporary_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temporary_file:

            temporary_file.write(
                await file.read()
            )

            temporary_path = temporary_file.name

        result = transcribe_video(temporary_path)

        return result

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.remove(temporary_path)