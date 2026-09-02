from fastapi import FastAPI

app = FastAPI(title="Simeon API")


@app.get("/")
def root():
    return {
        "message": "Simeon — Intelligent Biomedical Technician Friend",
        "status": "online"
    }