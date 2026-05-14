from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Favorito, Habitacion, Usuario
from dependencies import get_current_user

router = APIRouter(prefix="/favoritos", tags=["Favoritos"])


@router.post("/{habitacion_id}")
def toggle_favorito(
    habitacion_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    habitacion = db.query(Habitacion).filter(Habitacion.id == habitacion_id).first()
    if not habitacion:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")

    favorito = db.query(Favorito).filter(
        Favorito.usuario_id == usuario.id,
        Favorito.habitacion_id == habitacion_id,
    ).first()

    if favorito:
        db.delete(favorito)
        db.commit()
        return {"guardado": False}
    else:
        nuevo = Favorito(usuario_id=usuario.id, habitacion_id=habitacion_id)
        db.add(nuevo)
        db.commit()
        return {"guardado": True}


@router.get("/ids")
def get_favoritos_ids(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    favoritos = db.query(Favorito).filter(Favorito.usuario_id == usuario.id).all()
    return [f.habitacion_id for f in favoritos]


@router.get("")
def get_favoritos(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    favoritos = db.query(Favorito).filter(Favorito.usuario_id == usuario.id).all()
    habitacion_ids = [f.habitacion_id for f in favoritos]
    if not habitacion_ids:
        return []
    habitaciones = db.query(Habitacion).filter(Habitacion.id.in_(habitacion_ids)).all()
    return [
        {
            "id": h.id,
            "titulo": h.titulo,
            "precio": float(h.precio),
            "ciudad": h.ciudad,
            "foto_url": h.foto_url,
            "disponible": h.disponible,
        }
        for h in habitaciones
    ]
