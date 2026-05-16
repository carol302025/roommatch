from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Resena, Habitacion, RolUsuario
from schemas import ResenaCrear, ResenaResponse
from dependencies import get_current_user, require_rol
from models import Usuario

router = APIRouter(prefix="/resenas", tags=["Reseñas"])


@router.post("/{habitacion_id}", response_model=ResenaResponse, status_code=status.HTTP_201_CREATED)
def crear_resena(
    habitacion_id: int,
    datos: ResenaCrear,
    current_user: Usuario = Depends(require_rol(RolUsuario.inquilino)),
    db: Session = Depends(get_db),
):
    """Solo los inquilinos pueden dejar reseñas. Una reseña por habitación."""
    habitacion = db.query(Habitacion).filter(Habitacion.id == habitacion_id).first()
    if not habitacion:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")

    existe = db.query(Resena).filter(
        Resena.autor_id == current_user.id,
        Resena.habitacion_id == habitacion_id
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya has dejado una reseña para esta habitación")

    resena = Resena(
        autor_id=current_user.id,
        habitacion_id=habitacion_id,
        puntuacion=datos.puntuacion,
        comentario=datos.comentario,
    )
    db.add(resena)
    db.commit()
    db.refresh(resena)

    return ResenaResponse(
        id=resena.id,
        autor_id=resena.autor_id,
        habitacion_id=resena.habitacion_id,
        puntuacion=resena.puntuacion,
        comentario=resena.comentario,
        created_at=resena.created_at,
        autor_nombre=current_user.nombre,
    )


@router.get("/{habitacion_id}", response_model=List[ResenaResponse])
def listar_resenas(habitacion_id: int, db: Session = Depends(get_db)):
    """Devuelve todas las reseñas de una habitación. Público."""
    resenas = db.query(Resena).filter(Resena.habitacion_id == habitacion_id).all()
    return [
        ResenaResponse(
            id=r.id,
            autor_id=r.autor_id,
            habitacion_id=r.habitacion_id,
            puntuacion=r.puntuacion,
            comentario=r.comentario,
            created_at=r.created_at,
            autor_nombre=r.autor.nombre if r.autor else None,
        )
        for r in resenas
    ]


@router.delete("/{resena_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_resena(
    resena_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """El autor puede eliminar su propia reseña."""
    resena = db.query(Resena).filter(Resena.id == resena_id).first()
    if not resena:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    if resena.autor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo puedes eliminar tus propias reseñas")
    db.delete(resena)
    db.commit()
    return None
