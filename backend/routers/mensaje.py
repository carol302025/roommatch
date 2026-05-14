from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Mensaje, Usuario
from schemas import MensajeCrear, MensajeResponse, MarcarLeidoRequest, EliminarMensajeRequest
from dependencies import get_current_user

router = APIRouter(prefix="/mensaje", tags=["Mensaje"])


@router.post("/enviar", response_model=MensajeResponse, status_code=status.HTTP_201_CREATED)
def enviar_mensaje(
    datos: MensajeCrear,
    emisor: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if emisor.id == datos.receptor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes enviarte un mensaje a ti mismo"
        )

    receptor = db.query(Usuario).filter(
        Usuario.id == datos.receptor_id,
        Usuario.activo == True
    ).first()
    if receptor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario receptor no existe"
        )

    nuevo = Mensaje(
        emisor_id=emisor.id,
        receptor_id=datos.receptor_id,
        contenido=datos.contenido
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/conversacion", response_model=list[MensajeResponse])
def obtener_conversacion(
    otro_usuario_id: int = Query(..., description="ID del otro usuario"),
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mensajes = db.query(Mensaje).filter(
        (
            (Mensaje.emisor_id == usuario.id) &
            (Mensaje.receptor_id == otro_usuario_id) &
            (Mensaje.eliminado_por_emisor == False)
        ) |
        (
            (Mensaje.emisor_id == otro_usuario_id) &
            (Mensaje.receptor_id == usuario.id) &
            (Mensaje.eliminado_por_receptor == False)
        )
    ).order_by(Mensaje.fecha.asc()).all()
    return mensajes


@router.put("/conversacion/leida", response_model=list[MensajeResponse])
def marcar_como_leido(
    datos: MarcarLeidoRequest,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mensajes = db.query(Mensaje).filter(
        Mensaje.receptor_id == usuario.id,
        Mensaje.emisor_id == datos.emisor_id,
        Mensaje.leido == False
    ).all()
    for m in mensajes:
        m.leido = True
    db.commit()
    return mensajes


@router.delete("/conversacion/eliminar", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_conversacion(
    datos: EliminarMensajeRequest,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mensajes = db.query(Mensaje).filter(
        (
            (Mensaje.emisor_id == usuario.id) &
            (Mensaje.receptor_id == datos.otro_usuario_id)
        ) |
        (
            (Mensaje.emisor_id == datos.otro_usuario_id) &
            (Mensaje.receptor_id == usuario.id)
        )
    ).all()
    for m in mensajes:
        if m.emisor_id == usuario.id:
            m.eliminado_por_emisor = True
        else:
            m.eliminado_por_receptor = True
    db.commit()
    return None


@router.get("/no-leidos")
def contar_no_leidos(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Devuelve el número de mensajes no leídos del usuario."""
    count = db.query(Mensaje).filter(
        Mensaje.receptor_id == usuario.id,
        Mensaje.leido == False
    ).count()
    return {"count": count}


@router.get("/conversaciones", response_model=list[MensajeResponse])
def listar_conversaciones(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Devuelve el último mensaje de cada conversación del usuario."""
    from sqlalchemy import func as sqlfunc

    subquery = db.query(
        sqlfunc.greatest(Mensaje.emisor_id, Mensaje.receptor_id).label("usuario_a"),
        sqlfunc.least(Mensaje.emisor_id, Mensaje.receptor_id).label("usuario_b"),
        sqlfunc.max(Mensaje.id).label("ultimo_id")
    ).filter(
        (Mensaje.emisor_id == usuario.id) | (Mensaje.receptor_id == usuario.id)
    ).group_by("usuario_a", "usuario_b").subquery()

    mensajes = db.query(Mensaje).join(
        subquery, Mensaje.id == subquery.c.ultimo_id
    ).order_by(Mensaje.fecha.desc()).all()

    return mensajes
