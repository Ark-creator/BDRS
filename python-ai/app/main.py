from fastapi import FastAPI, File, Form, UploadFile

from app.services.face import compare_faces
from app.services.fraud import analyze_fraud
from app.services.liveness import check_liveness
from app.services.ocr import extract_ocr
from app.services.selfie import validate_selfie

app = FastAPI(title="BDRS Identity AI Service", version="1.0.0")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/ocr/extract")
async def ocr_extract(
    image: UploadFile = File(...),
    document_type: str | None = Form(default=None),
    document_side: str = Form(default="front"),
) -> dict:
    return extract_ocr(await image.read(), image.filename or "id-image", document_type, document_side)


@app.post("/face/compare")
async def face_compare(
    id_image: UploadFile = File(...),
    selfie_image: UploadFile = File(...),
) -> dict:
    return compare_faces(
        await id_image.read(),
        await selfie_image.read(),
        id_image.filename or "id-image",
        selfie_image.filename or "selfie-image",
    )


@app.post("/liveness/check")
async def liveness_check(selfie_image: UploadFile = File(...)) -> dict:
    return check_liveness(await selfie_image.read(), selfie_image.filename or "selfie-image")


@app.post("/selfie/validate")
async def selfie_validate(image: UploadFile = File(...)) -> dict:
    return validate_selfie(await image.read(), image.filename or "selfie-image")


@app.post("/fraud/analyze")
async def fraud_analyze(
    id_image: UploadFile = File(...),
    selfie_image: UploadFile = File(...),
    id_image_hash: str | None = Form(default=None),
    selfie_image_hash: str | None = Form(default=None),
) -> dict:
    return analyze_fraud(
        await id_image.read(),
        await selfie_image.read(),
        id_image_hash=id_image_hash,
        selfie_image_hash=selfie_image_hash,
    )
