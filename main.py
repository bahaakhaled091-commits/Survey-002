from pathlib import Path
from uuid import uuid4
from datetime import datetime, timezone
import json

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
UPLOADS = DATA / "uploads"
PROJECTS = DATA / "projects"
UPLOADS.mkdir(parents=True, exist_ok=True)
PROJECTS.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="AI Survey & Building Intelligence API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    survey_type: str = Field(pattern="^(interior|exterior|both)$")
    coordinate_system: str = "Local / Not georeferenced"
    known_distance_m: float | None = Field(default=None, gt=0)
    control_method: str = "scale_reference"

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ai-survey-api", "version": "0.1.0"}

@app.post("/api/projects")
def create_project(payload: ProjectCreate):
    project_id = str(uuid4())
    record = {
        "id": project_id,
        "name": payload.name,
        "survey_type": payload.survey_type,
        "coordinate_system": payload.coordinate_system,
        "known_distance_m": payload.known_distance_m,
        "control_method": payload.control_method,
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "images": [],
        "processing": {"stage": "not_started", "progress": 0},
        "outputs": [],
        "accuracy": {"classification": "unverified", "check_points": 0, "rmse": None},
    }
    (PROJECTS / f"{project_id}.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
    return record

@app.get("/api/projects")
def list_projects():
    result = []
    for path in PROJECTS.glob("*.json"):
        result.append(json.loads(path.read_text(encoding="utf-8")))
    return sorted(result, key=lambda x: x["created_at"], reverse=True)

@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    path = PROJECTS / f"{project_id}.json"
    if not path.exists():
        raise HTTPException(404, "Project not found")
    return json.loads(path.read_text(encoding="utf-8"))

@app.post("/api/projects/{project_id}/images")
async def upload_images(project_id: str, files: list[UploadFile] = File(...)):
    path = PROJECTS / f"{project_id}.json"
    if not path.exists():
        raise HTTPException(404, "Project not found")
    project = json.loads(path.read_text(encoding="utf-8"))
    folder = UPLOADS / project_id
    folder.mkdir(parents=True, exist_ok=True)
    saved = []
    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    for file in files:
        suffix = Path(file.filename or "").suffix.lower()
        if suffix not in allowed:
            raise HTTPException(400, f"Unsupported image type: {suffix}")
        image_id = str(uuid4())
        target = folder / f"{image_id}{suffix}"
        content = await file.read()
        if len(content) > 30 * 1024 * 1024:
            raise HTTPException(413, "Each image must be 30 MB or less")
        target.write_bytes(content)
        item = {"id": image_id, "filename": file.filename, "stored_as": target.name, "bytes": len(content)}
        project["images"].append(item)
        saved.append(item)
    project["status"] = "images_uploaded"
    path.write_text(json.dumps(project, indent=2), encoding="utf-8")
    return {"uploaded": saved, "count": len(saved)}

@app.post("/api/projects/{project_id}/process")
def start_processing(project_id: str):
    path = PROJECTS / f"{project_id}.json"
    if not path.exists():
        raise HTTPException(404, "Project not found")
    project = json.loads(path.read_text(encoding="utf-8"))
    if len(project["images"]) < 3:
        raise HTTPException(400, "At least 3 overlapping images are required to start a reconstruction job")
    # Placeholder: production worker will enqueue COLMAP/OpenMVS processing here.
    project["status"] = "queued"
    project["processing"] = {"stage": "queued_for_reconstruction", "progress": 0}
    path.write_text(json.dumps(project, indent=2), encoding="utf-8")
    return {"message": "Project queued. Photogrammetry worker integration is the next development step.", "project": project}
