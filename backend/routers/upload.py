import os
import uuid
import requests
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/upload", tags=["Upload"])

EXTENSIONES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}
TAMANO_MAXIMO = 5 * 1024 * 1024  # 5 MB

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET = "fotos"


@router.post("/foto")
async def subir_foto(file: UploadFile = File(...)):
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(status_code=400, detail="Formato no permitido. Usa JPG, PNG o WEBP.")

    contenido = await file.read()
    if len(contenido) > TAMANO_MAXIMO:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB.")

    nombre = f"{uuid.uuid4()}{extension}"

    content_type = file.content_type or "image/jpeg"
    resp = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{nombre}",
        headers={
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": content_type,
        },
        data=contenido,
    )

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail=f"Supabase error {resp.status_code}: {resp.text}")

    url_publica = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{nombre}"
    return JSONResponse({"url": url_publica})
