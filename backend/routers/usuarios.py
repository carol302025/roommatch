"""
Router de usuarios: registro, login, perfil, gestion de cuenta.

Funciona para los dos roles (inquilino y propietario) gracias al modelo Usuario unificado.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from routers.habitaciones import _calcular_score
from models import Habitacion

from database import get_db
from models import Usuario, PerfilInquilino, PreferenciasInquilino, RolUsuario
from schemas import (
    UsuarioRegistro,
    UsuarioUpdate,
    UsuarioResponse,
    LoginRequest,
    TokenResponse,
    EmailRequest,
    ResetPasswordRequest,
    NotificacionUpdate,
    PasswordUpdate,
    PerfilInquilinoUpdate,
    PerfilInquilinoResponse,
    PreferenciasInquilinoUpdate,
    PreferenciasInquilinoResponse,
)
from auth import hash_password, verify_password, create_access_token, decode_access_token
from dependencies import get_current_user

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


# ==========================================================
# REGISTRO Y LOGIN
# ==========================================================
@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar_usuario(datos: UsuarioRegistro, db: Session = Depends(get_db)):
    try:
        existe = db.query(Usuario).filter(Usuario.email == datos.email).first()
        if existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya esta registrado"
            )

        nuevo = Usuario(
            nombre=datos.nombre,
            email=datos.email,
            password_hash=hash_password(datos.password),
            rol=datos.rol,
            telefono=datos.telefono,
        )
        db.add(nuevo)
        db.flush()

        if datos.rol == RolUsuario.inquilino:
            perfil = PerfilInquilino(usuario_id=nuevo.id)
            db.add(perfil)

        db.commit()
        db.refresh(nuevo)
        return nuevo

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR REGISTRO: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Error interno al crear la cuenta. Inténtalo de nuevo.")


@router.post("/login", response_model=TokenResponse)
def login_usuario(datos: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica un usuario por email + password.
    Devuelve un token JWT que contiene el rol, para que el frontend
    pueda redirigir correctamente.
    """
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()

    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contrasena incorrectos"
        )

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta cuenta esta desactivada"
        )

    # sub = identificador del usuario (standard JWT claim)
    token = create_access_token({
        "sub": str(usuario.id),
        "rol": usuario.rol.value,
        "email": usuario.email,
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        rol=usuario.rol,
        usuario_id=usuario.id,
    )


# ==========================================================
# PERFIL DEL USUARIO LOGUEADO
# ==========================================================
@router.get("/me", response_model=UsuarioResponse)
def leer_mi_perfil(current_user: Usuario = Depends(get_current_user)):
    """Devuelve los datos del usuario autenticado."""
    return current_user


@router.put("/me", response_model=UsuarioResponse)
def actualizar_mi_perfil(
    datos: UsuarioUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualiza datos del usuario autenticado."""
    # Si se cambia el email, verificar que no este en uso
    if datos.email and datos.email != current_user.email:
        existe = db.query(Usuario).filter(
            Usuario.email == datos.email,
            Usuario.id != current_user.id
        ).first()
        if existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ese email ya esta registrado por otro usuario"
            )
        current_user.email = datos.email

    if datos.nombre is not None:
        current_user.nombre = datos.nombre
    if datos.telefono is not None:
        current_user.telefono = datos.telefono
    if datos.foto_perfil is not None:
        current_user.foto_perfil = datos.foto_perfil

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password")
def cambiar_password(
    datos: PasswordUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cambia la contrasena del usuario autenticado."""
    if not verify_password(datos.password_actual, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La contrasena actual no es correcta"
        )

    current_user.password_hash = hash_password(datos.password_nuevo)
    db.commit()
    return {"msg": "Contrasena actualizada correctamente"}


@router.put("/me/notificaciones", response_model=UsuarioResponse)
def actualizar_notificaciones(
    datos: NotificacionUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Activa o desactiva las notificaciones del usuario."""
    current_user.notificaciones_activas = datos.notificaciones_activas
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_mi_cuenta(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Desactiva la cuenta del usuario (soft delete).
    Los datos se conservan por si hay valoraciones, mensajes, etc.
    """
    current_user.activo = False
    db.commit()
    return None


# ==========================================================
# PERFIL DE INQUILINO
# ==========================================================
@router.get("/me/perfil-inquilino", response_model=PerfilInquilinoResponse)
def get_perfil_inquilino(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    perfil = db.query(PerfilInquilino).filter(PerfilInquilino.usuario_id == current_user.id).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return perfil


@router.put("/me/perfil-inquilino", response_model=PerfilInquilinoResponse)
def actualizar_perfil_inquilino(
    datos: PerfilInquilinoUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    perfil = db.query(PerfilInquilino).filter(PerfilInquilino.usuario_id == current_user.id).first()
    if not perfil:
        perfil = PerfilInquilino(usuario_id=current_user.id)
        db.add(perfil)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(perfil, campo, valor)
    db.commit()
    db.refresh(perfil)
    return perfil


@router.get("/me/preferencias", response_model=PreferenciasInquilinoResponse)
def get_preferencias_inquilino(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    perfil = db.query(PerfilInquilino).filter(PerfilInquilino.usuario_id == current_user.id).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    if not perfil.preferencias:
        raise HTTPException(status_code=404, detail="Sin preferencias configuradas")
    return perfil.preferencias


@router.put("/me/preferencias", response_model=PreferenciasInquilinoResponse)
def actualizar_preferencias_inquilino(
    datos: PreferenciasInquilinoUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    perfil = db.query(PerfilInquilino).filter(PerfilInquilino.usuario_id == current_user.id).first()
    if not perfil:
        perfil = PerfilInquilino(usuario_id=current_user.id)
        db.add(perfil)
        db.flush()

    prefs = db.query(PreferenciasInquilino).filter(
        PreferenciasInquilino.perfil_inquilino_id == perfil.id
    ).first()
    if prefs:
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(prefs, campo, valor)
    else:
        prefs = PreferenciasInquilino(perfil_inquilino_id=perfil.id, **datos.model_dump())
        db.add(prefs)
    db.commit()
    db.refresh(prefs)
    return prefs


# ==========================================================
# ==========================================================
# COMPATIBILIDAD ENTRE PROPIETARIO E INQUILINO
# ==========================================================
@router.get("/{inquilino_id}/compatibilidad")
def calcular_compatibilidad(
    inquilino_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    perfil = db.query(PerfilInquilino).filter(PerfilInquilino.usuario_id == inquilino_id).first()
    if not perfil:
        return {"score": None, "color": "gris", "etiqueta": "Sin perfil configurado"}

    preferencias = perfil.preferencias

    habitaciones = db.query(Habitacion).filter(
        Habitacion.propietario_id == current_user.id,
        Habitacion.disponible == True
    ).all()

    if not habitaciones:
        return {"score": None, "color": "gris", "etiqueta": "Sin habitaciones activas"}

    scores = [_calcular_score(h, perfil, preferencias) for h in habitaciones]
    score = max(scores)

    return {
        "score": score,
        "color": "verde" if score >= 80 else "naranja" if score >= 50 else "gris",
        "etiqueta": "Alta compatibilidad" if score >= 80 else "Compatibilidad media" if score >= 50 else "Poca compatibilidad",
    }


# ==========================================================
# RECUPERACION DE CONTRASENA
# ==========================================================
@router.get("/{usuario_id}/publico")
def perfil_publico(usuario_id: int, db: Session = Depends(get_db)):
    """Devuelve el perfil público de un usuario."""
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.activo == True
    ).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    perfil_hab = None
    if usuario.rol == RolUsuario.inquilino:
        p = db.query(PerfilInquilino).filter(PerfilInquilino.usuario_id == usuario_id).first()
        if p:
            perfil_hab = {
                "edad": p.edad,
                "bio": p.bio,
                "genero": p.genero,
                "fumador": p.fumador,
                "tiene_mascota": p.tiene_mascota,
                "estilo_vida": p.estilo_vida,
                "tipo_persona": p.tipo_persona,
                "nivel_ruido": p.nivel_ruido,
                "nivel_orden": p.nivel_orden,
                "horario": p.horario,
                "tiene_visitas": p.tiene_visitas,
                "sociabilidad": p.sociabilidad,
            }

    return {
        "id": usuario.id,
        "nombre": usuario.nombre,
        "rol": usuario.rol,
        "foto_perfil": usuario.foto_perfil,
        "telefono": usuario.telefono,
        "created_at": usuario.created_at,
        "email_verificado": usuario.email_verificado,
        "perfil_inquilino": perfil_hab,
    }


@router.post("/recuperar-password")
def solicitar_recuperacion_password(datos: EmailRequest, db: Session = Depends(get_db)):
    """
    Simula el envio de un email de recuperacion.
    Por seguridad, siempre devuelve el mismo mensaje (exista o no el email)
    para evitar que se pueda usar para descubrir emails registrados.
    """
    usuario = db.query(Usuario).filter(
        Usuario.email == datos.email,
        Usuario.activo == True
    ).first()

    if usuario:
        # Generar token especifico para recuperacion (no usa el token normal)
        token = create_access_token({
            "sub": str(usuario.id),
            "tipo": "recuperar",
        })
        # TODO: en produccion, enviar email real
        print(f"[DEV] Enlace de recuperacion: http://localhost:5173/reset-password?token={token}")

    return {"msg": "Si el email existe, se enviara un enlace"}


@router.post("/reset-password")
def resetear_password(datos: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Restablece la contrasena usando el token recibido por email."""
    payload = decode_access_token(datos.token)

    if not payload or payload.get("tipo") != "recuperar":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o expirado"
        )

    usuario = db.query(Usuario).filter(
        Usuario.id == int(payload.get("sub")),
        Usuario.activo == True
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    usuario.password_hash = hash_password(datos.new_password)
    db.commit()

    return {"msg": "Contrasena actualizada correctamente"}


# ==========================================================
# VERIFICACION DE USUARIOS (solo admin)
# ==========================================================
@router.put("/{usuario_id}/verificar")
def verificar_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Marca el email de un usuario como verificado.
    Solo puede ejecutarlo un usuario con rol 'admin'.
    El badge 'Verificado' aparece en su perfil público y en el chat.
    """
    if current_user.rol != RolUsuario.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo un administrador puede verificar usuarios"
        )

    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.activo == True
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    usuario.email_verificado = True
    db.commit()

    return {"msg": f"Usuario {usuario.nombre} verificado correctamente", "email_verificado": True}