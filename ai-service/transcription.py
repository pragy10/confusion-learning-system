import os
import whisper


FFMPEG_PATH = r"C:\Users\pragy\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg.Shared_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build-shared\bin"

os.environ["PATH"] = FFMPEG_PATH + os.pathsep + os.environ.get("PATH", "")


MODEL_NAME = "base"

print(f"Loading Whisper model: {MODEL_NAME}")
model = whisper.load_model(MODEL_NAME)
print("Whisper model loaded.")


def transcribe_video(video_path: str):
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