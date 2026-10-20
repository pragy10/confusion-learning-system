import os

FFMPEG_PATH = r"C:\Users\pragy\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg.Shared_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build-shared\bin"
if os.path.exists(FFMPEG_PATH):
    os.environ["PATH"] = FFMPEG_PATH + os.pathsep + os.environ.get("PATH", "")

MODEL_NAME = "base"
_model = None


def get_model():
    global _model
    if _model is None:
        try:
            import whisper
            print(f"Loading Whisper model: {MODEL_NAME}")
            _model = whisper.load_model(MODEL_NAME)
            print("Whisper model loaded.")
        except Exception as e:
            print(f"Failed to load Whisper: {e}")
            raise e
    return _model


def transcribe_video(video_path: str):
    model = get_model()
    result = model.transcribe(
        video_path,
        fp16=False
    )

    segments = []

    for index, segment in enumerate(result["segments"], start=1):
        segments.append(
            {
                "id": index,
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"].strip(),
            }
        )

    return {
        "text": result["text"].strip(),
        "segments": segments,
    }
