"""
Router de Habitaciones — CRUD completo + listado público con filtros.

Endpoints públicos (sin login):
  - GET  /habitaciones           → listar (con filtros opcionales)
  - GET  /habitaciones/{id}      → detalle

Endpoints privados (requieren JWT):
  - GET    /habitaciones/mis/listado       → habitaciones del propietario actual
  - POST   /habitaciones                   → crear (solo propietario)
  - PUT    /habitaciones/{id}              → editar (solo dueño)
  - DELETE /habitaciones/{id}              → desactivar (solo dueño) — soft delete
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import date

from database import get_db
from models import Habitacion, Usuario, RolUsuario, PreferenciasCasa, PerfilInquilino
from schemas import (
    HabitacionCrear,
    HabitacionActualizar,
    HabitacionRespuesta,
    PreferenciasCasaCrear,
    PreferenciasCasaResponse,
)
from dependencies import get_current_user, require_rol

router = APIRouter(prefix="/habitaciones", tags=["Habitaciones"])


# ---------------------------------------------------------------------------
# LISTADO PÚBLICO (con filtros)
# ---------------------------------------------------------------------------
@router.get("", response_model=List[HabitacionRespuesta])
def listar_habitaciones(
    ciudad: Optional[str] = Query(None),
    precio_min: Optional[float] = Query(None, ge=0),
    precio_max: Optional[float] = Query(None, gt=0),
    tipo_inquilino: Optional[str] = Query(None),
    fecha: Optional[date] = Query(None, description="Fecha de entrada deseada (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    query = db.query(Habitacion).filter(Habitacion.disponible == True)

    if ciudad:
        query = query.filter(Habitacion.ciudad.ilike(f"%{ciudad}%"))
    if precio_min is not None:
        query = query.filter(Habitacion.precio >= precio_min)
    if precio_max is not None:
        query = query.filter(Habitacion.precio <= precio_max)
    if tipo_inquilino:
        query = query.join(PreferenciasCasa, PreferenciasCasa.habitacion_id == Habitacion.id)\
                     .filter(PreferenciasCasa.tipo_inquilino == tipo_inquilino)
    if fecha is not None:
        # Mostrar habitaciones sin fecha definida (disponibles ya) o cuya fecha_disponible <= fecha buscada
        query = query.filter(
            or_(Habitacion.fecha_disponible == None, Habitacion.fecha_disponible <= fecha)
        )


    # Orden: más recientes primero
    habitaciones = query.order_by(Habitacion.created_at.desc()).all()
    return habitaciones


# ---------------------------------------------------------------------------
# HABITACIONES DEL PROPIETARIO ACTUAL
# ---------------------------------------------------------------------------
# OJO: esta ruta va ANTES de /{id}, si no FastAPI interpretaría "mis" como un id.
@router.get("/mis/listado", response_model=List[HabitacionRespuesta])
def mis_habitaciones(
    usuario: Usuario = Depends(require_rol(RolUsuario.propietario)),
    db: Session = Depends(get_db),
):
    """
    Devuelve las habitaciones publicadas por el propietario que está logueado.
    Incluye las inactivas (para que pueda reactivarlas si quiere).
    """
    return (
        db.query(Habitacion)
        .filter(Habitacion.propietario_id == usuario.id)
        .order_by(Habitacion.created_at.desc())
        .all()
    )


# ---------------------------------------------------------------------------
# MATCHES — habitaciones ordenadas por compatibilidad con el inquilino
# ---------------------------------------------------------------------------
@router.get("/matches")
def get_matches(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    perfil = db.query(PerfilInquilino).filter(PerfilInquilino.usuario_id == usuario.id).first()
    preferencias = perfil.preferencias if perfil else None

    tiene_preferencias = (
        (preferencias and (preferencias.presupuesto_max or preferencias.ciudad_preferida))
        or (perfil and (perfil.fumador or perfil.tiene_mascota or perfil.tipo_persona
                        or perfil.nivel_ruido or perfil.nivel_orden or perfil.horario))
    )
    if not tiene_preferencias:
        return []

    query = db.query(Habitacion).filter(Habitacion.disponible == True)
    if preferencias and preferencias.ciudad_preferida:
        query = query.filter(Habitacion.ciudad.ilike(f"%{preferencias.ciudad_preferida}%"))
    habitaciones = query.all()

    resultado = []
    for h in habitaciones:
        score = _calcular_score(h, perfil, preferencias)
        resultado.append({
            "id": h.id,
            "titulo": h.titulo,
            "precio": float(h.precio),
            "ciudad": h.ciudad,
            "foto_url": h.foto_url,
            "score": score,
            "color": "verde" if score >= 80 else "naranja" if score >= 50 else "gris",
            "etiqueta": "Alta compatibilidad" if score >= 80 else "Compatibilidad media" if score >= 50 else "Poca compatibilidad",
        })

    resultado.sort(key=lambda x: x["score"], reverse=True)
    return resultado[:6]


def _calcular_score(habitacion, perfil, preferencias):
    puntos = 0
    maximo = 0
    pref_casa = habitacion.preferencias

    # Presupuesto (20 pts)
    if preferencias and preferencias.presupuesto_max:
        maximo += 20
        precio = float(habitacion.precio)
        if precio <= preferencias.presupuesto_max:
            puntos += 20
        elif precio <= preferencias.presupuesto_max * 1.15:
            puntos += 8

    # Ciudad (15 pts)
    if preferencias and preferencias.ciudad_preferida:
        maximo += 15
        if habitacion.ciudad.lower() == preferencias.ciudad_preferida.lower():
            puntos += 15

    # Tipo de persona (20 pts)
    if perfil and perfil.tipo_persona and pref_casa and pref_casa.perfil_buscado:
        maximo += 20
        if pref_casa.perfil_buscado == 'cualquiera' or perfil.tipo_persona == pref_casa.perfil_buscado:
            puntos += 20

    # Nivel de ruido vs ambiente de la casa (15 pts)
    if perfil and perfil.nivel_ruido and pref_casa and pref_casa.ambiente_casa:
        maximo += 15
        if pref_casa.ambiente_casa == 'flexible' or perfil.nivel_ruido == pref_casa.ambiente_casa:
            puntos += 15

    # Nivel de orden (10 pts)
    if perfil and perfil.nivel_orden and pref_casa and pref_casa.orden_esperado:
        maximo += 10
        if pref_casa.orden_esperado == 'flexible' or perfil.nivel_orden == pref_casa.orden_esperado:
            puntos += 10

    # Horario (10 pts)
    if perfil and perfil.horario and pref_casa and pref_casa.horario_casa:
        maximo += 10
        if pref_casa.horario_casa == 'flexible' or perfil.horario == pref_casa.horario_casa:
            puntos += 10

    # Visitas (5 pts)
    if perfil and perfil.tiene_visitas and pref_casa and pref_casa.acepta_visitas is not None:
        maximo += 5
        if pref_casa.acepta_visitas:
            puntos += 5

    # Fumador (5 pts)
    if perfil and perfil.fumador:
        maximo += 5
        if pref_casa and pref_casa.fumar_permitido:
            puntos += 5

    # Mascota (5 pts)
    if perfil and perfil.tiene_mascota:
        maximo += 5
        if pref_casa and pref_casa.mascotas_permitidas:
            puntos += 5

    # Gastos incluidos (10 pts)
    if preferencias and preferencias.gastos_incluidos:
        maximo += 10
        if pref_casa and pref_casa.gastos_incluidos:
            puntos += 10

    if maximo == 0:
        return 70
    return round((puntos / maximo) * 100)




# ---------------------------------------------------------------------------
# DETALLE (público)
# ---------------------------------------------------------------------------
@router.get("/{habitacion_id}", response_model=HabitacionRespuesta)
def obtener_habitacion(habitacion_id: int, db: Session = Depends(get_db)):
    """Detalle completo de una habitación. Público."""
    habitacion = (
        db.query(Habitacion)
        .filter(and_(Habitacion.id == habitacion_id, Habitacion.disponible == True))  # noqa: E712
        .first()
    )
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada",
        )
    return habitacion


# ---------------------------------------------------------------------------
# CREAR (solo propietarios)
# ---------------------------------------------------------------------------
@router.post("", response_model=HabitacionRespuesta, status_code=status.HTTP_201_CREATED)
def crear_habitacion(
    datos: HabitacionCrear,
    usuario: Usuario = Depends(require_rol(RolUsuario.propietario)),
    db: Session = Depends(get_db),
):
    """
    Publica una nueva habitación.
    Solo accesible para usuarios con rol = propietario.
    El propietario_id se saca del JWT, nunca del body (seguridad).
    """
    nueva = Habitacion(
        **datos.model_dump(),          # todos los campos del schema
        propietario_id=usuario.id,     # dueño = usuario logueado
        disponible=True,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


# ---------------------------------------------------------------------------
# ACTUALIZAR (solo dueño)
# ---------------------------------------------------------------------------
@router.put("/{habitacion_id}", response_model=HabitacionRespuesta)
def actualizar_habitacion(
    habitacion_id: int,
    datos: HabitacionActualizar,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Edita una habitación existente.
    Solo el propietario dueño puede hacerlo.
    Solo se actualizan los campos que vengan en el body (patch parcial).
    """
    habitacion = db.query(Habitacion).filter(Habitacion.id == habitacion_id).first()

    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada",
        )

    # Solo el dueño puede editar su habitación
    if habitacion.propietario_id != usuario.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para editar esta habitación",
        )

    # Actualizamos solo los campos que vienen rellenos
    campos_a_actualizar = datos.model_dump(exclude_unset=True)
    for campo, valor in campos_a_actualizar.items():
        setattr(habitacion, campo, valor)

    db.commit()
    db.refresh(habitacion)
    return habitacion


# ---------------------------------------------------------------------------
# ELIMINAR (soft delete — solo dueño)
# ---------------------------------------------------------------------------
@router.delete("/{habitacion_id}", status_code=status.HTTP_200_OK)
def eliminar_habitacion(
    habitacion_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Desactiva la habitación (soft delete: activa=False).
    No se borra de la DB para mantener histórico y por si el propietario
    la quiere reactivar.
    """
    habitacion = db.query(Habitacion).filter(Habitacion.id == habitacion_id).first()

    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada",
        )

    if habitacion.propietario_id != usuario.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar esta habitación",
        )

    habitacion.disponible = False
    db.commit()
    return {"mensaje": "Habitación desactivada correctamente"}

# ---------------------------------------------------------------------------
# PREFERENCIAS DE LA CASA (solo dueño)
# ---------------------------------------------------------------------------
@router.post("/{habitacion_id}/preferencias", response_model=PreferenciasCasaResponse, status_code=status.HTTP_201_CREATED)
def guardar_preferencias(
    habitacion_id: int,
    datos: PreferenciasCasaCrear,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Guarda las preferencias de la casa para una habitación. Solo el dueño puede hacerlo."""
    habitacion = db.query(Habitacion).filter(Habitacion.id == habitacion_id).first()

    if not habitacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habitación no encontrada")

    if habitacion.propietario_id != usuario.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso")

    preferencia = PreferenciasCasa(
        habitacion_id=habitacion_id,
        **datos.model_dump()
    )
    db.add(preferencia)
    db.commit()
    db.refresh(preferencia)
    return preferencia


@router.put("/{habitacion_id}/preferencias", response_model=PreferenciasCasaResponse)
def actualizar_preferencias(
    habitacion_id: int,
    datos: PreferenciasCasaCrear,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualiza las preferencias existentes o las crea si no existen (upsert)."""
    habitacion = db.query(Habitacion).filter(Habitacion.id == habitacion_id).first()
    if not habitacion:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    if habitacion.propietario_id != usuario.id:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    preferencia = db.query(PreferenciasCasa).filter(PreferenciasCasa.habitacion_id == habitacion_id).first()
    if preferencia:
        for campo, valor in datos.model_dump().items():
            setattr(preferencia, campo, valor)
    else:
        preferencia = PreferenciasCasa(habitacion_id=habitacion_id, **datos.model_dump())
        db.add(preferencia)

    db.commit()
    db.refresh(preferencia)
    return preferencia


