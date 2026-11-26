# AI Survey Studio — starter MVP 0.1

This is the first software scaffold for the AI Survey & Building Intelligence platform.

## Included in this build
- FastAPI backend with health check
- Project creation and listing
- Multi-image upload with basic file validation
- Reconstruction job queue placeholder and minimum-image check
- React dashboard for project creation, image upload, and job submission
- Project metadata includes survey scope, reference distance, coordinate-system label, processing state, and accuracy QA placeholder

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## Important current limitations
- The reconstruction endpoint is intentionally a queue placeholder. COLMAP/OpenMVS worker integration is not included yet.
- No metric accuracy is claimed. A known distance alone is not a survey control network.
- DXF, LAS/LAZ, E57, BIM, material classification, and BOQ generation are planned modules, not implemented in this scaffold.
- The prototype stores project JSON and images locally. It is not production-ready for multi-user or commercial deployment.

## Next engineering milestones
1. Add PostgreSQL/PostGIS, object storage, authentication, and tenant isolation.
2. Add image EXIF ingestion, camera calibration, image quality and overlap checks.
3. Integrate COLMAP reconstruction worker and OpenMVS dense reconstruction.
4. Add GCP/check-point adjustment and accuracy report.
5. Add point-cloud viewer and export pipeline (PLY/LAS/LAZ/E57 as supported).
6. Add semantic segmentation, geometry extraction, CAD generation, and measured BOQ.
