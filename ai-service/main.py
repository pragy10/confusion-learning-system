from fastapi import FastAPI

app = FastAPI(
    title="Confusion Learning AI Service",
    version="0.1.0"
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-service"
    }