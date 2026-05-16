from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import models  # Importa los modelos para que SQLAlchemy los registre en Base
from routers import usuarios, habitaciones, mensaje, upload, favoritos, resenas
import os


# ----------------------------------------------------------
# Configuracion de la aplicacion
# ----------------------------------------------------------
app = FastAPI(
    title="RoomMatch API",
    description="API para gestionar la aplicacion RoomMatch - busqueda de companeros de piso",
    version="1.0.0",
)

try:
    Base.metadata.create_all(bind=engine)
    # Migración: añadir columna fecha_disponible si no existe
    with engine.connect() as conn:
        conn.execute(__import__('sqlalchemy').text(
            "ALTER TABLE habitacion ADD COLUMN IF NOT EXISTS fecha_disponible DATE;"
        ))
        conn.commit()
    print("✅ Base de datos conectada correctamente")
except Exception as e:
    print(f" No se pudo conectar a la BD al arrancar: {e}")


# ----------------------------------------------------------
# CORS (permitir llamadas desde el frontend React)
# ----------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://roommatch.tech",
        "https://www.roommatch.tech",
        "https://roommatch-plum.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------
# Endpoints raiz y healthcheck
# ----------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    """Endpoint raiz, util para confirmar que la API esta viva."""
    return {
        "app": "RoomMatch API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
def health():
    """Healthcheck usado por Render/Vercel para verificar el servicio."""
    return {"status": "ok"}


# ----------------------------------------------------------
# Routers (rutas agrupadas por dominio)
# ----------------------------------------------------------
app.include_router(usuarios.router) # Router para registro/login y gestion de usuarios
app.include_router(habitaciones.router) # Router para CRUD de habitaciones
app.include_router(mensaje.router) # Router para mensajes entre usuarios
app.include_router(upload.router)
app.include_router(favoritos.router)
app.include_router(resenas.router)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")